"""Athlete profile, shooter tier progression, and coach-athlete linkage.

Implements BFR sections 1.1 (Athlete), 2.2 (registration matrix),
3 (tier progression) and the Coach-Athlete linkage workflow.
"""
from __future__ import annotations

from datetime import date

from django.conf import settings
from django.db import models
from django.utils import timezone


# --- Choice enums (from the BFR) ---------------------------------------------

class Gender(models.TextChoices):
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    OTHER = 'other', 'Other'


class DominantHand(models.TextChoices):
    RIGHT = 'RH', 'Right Hand'
    LEFT = 'LH', 'Left Hand'


class DominantEye(models.TextChoices):
    RIGHT = 'right', 'Right'
    LEFT = 'left', 'Left'
    CROSS = 'cross', 'Cross-Dominant'


class Discipline(models.TextChoices):
    AIR_RIFLE = 'air_rifle', '10m Air Rifle'
    AIR_PISTOL = 'air_pistol', '10m Air Pistol'


class DietType(models.TextChoices):
    VEG = 'veg', 'Vegetarian'
    NON_VEG = 'non_veg', 'Non-Vegetarian'
    VEGAN = 'vegan', 'Vegan'
    EGGETARIAN = 'eggetarian', 'Eggetarian'


class ShooterTier(models.TextChoices):
    """Ordered progression. Foundation tiers then competitive tiers."""
    ROOKIE = 'rookie', 'Rookie'
    NOVICE = 'novice', 'Novice'
    MARKSMAN = 'marksman', 'Marksman'
    SHARPSHOOTER = 'sharpshooter', 'Sharpshooter'
    DISTRICT = 'district', 'District / Pre-State Qualified'
    STATE = 'state', 'State Qualified'
    ZONE = 'zone', 'Zone Qualified'
    NATIONAL = 'national', 'National Qualified'
    TRIAL = 'trial', 'Trial Qualified'
    NATIONAL_TEAM = 'national_team', 'National Team Qualified'


# Order used to validate progression direction.
TIER_ORDER = [t.value for t in ShooterTier]


class AthleteLinkStatus(models.TextChoices):
    PENDING = 'pending', 'Pending Verification'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


def age_category_for(dob: date | None) -> str:
    """Map date of birth to an ISSF-style age category (auto-calculated)."""
    if not dob:
        return ''
    today = timezone.now().date()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age <= 14:
        return 'Sub-Youth'
    if age <= 17:
        return 'Youth'
    if age <= 20:
        return 'Junior'
    return 'Senior'


# --- Master data -------------------------------------------------------------

class Club(models.Model):
    """Master list of registered clubs/states (BFR 2.2 State/Club Link)."""
    name = models.CharField(max_length=120)
    state = models.CharField(max_length=80)

    class Meta:
        unique_together = ('name', 'state')
        ordering = ['state', 'name']

    def __str__(self):
        return f'{self.name}, {self.state}'


# --- Athlete profile ---------------------------------------------------------

class AthleteProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='athlete_profile'
    )

    shooting_assoc_id = models.CharField(
        max_length=50, blank=True, help_text='Optional National/State association ID'
    )
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    state = models.CharField(max_length=80, blank=True)
    club = models.ForeignKey(Club, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='athletes')

    dominant_hand = models.CharField(max_length=2, choices=DominantHand.choices, blank=True)
    dominant_eye = models.CharField(max_length=10, choices=DominantEye.choices, blank=True)
    discipline = models.CharField(max_length=20, choices=Discipline.choices, blank=True)
    diet_type = models.CharField(max_length=20, choices=DietType.choices, blank=True)

    # Current tier is read-only to the athlete; only a coach may change it.
    current_tier = models.CharField(
        max_length=20, choices=ShooterTier.choices, default=ShooterTier.ROOKIE
    )

    # Linkage / subscription
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='athletes'
    )
    parent = models.ForeignKey(
        'coaching.ParentProfile', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='children'
    )
    registered_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f'Athlete: {self.user.full_name or self.user.identifier}'

    @property
    def age_category(self) -> str:
        return age_category_for(self.dob)

    @property
    def is_coached(self) -> bool:
        return self.coach_id is not None

    @property
    def trial_end_date(self):
        return self.registered_on + timezone.timedelta(days=settings.TRIAL_PERIOD_DAYS)

    def set_tier(self, new_tier: str) -> None:
        """Coach-driven tier update. Validates it is a known tier value."""
        if new_tier not in TIER_ORDER:
            raise ValueError(f'Unknown tier: {new_tier}')
        self.current_tier = new_tier
        self.save(update_fields=['current_tier'])


class CoachAthleteLink(models.Model):
    """The connection request between an athlete and a coach.

    Workflow (BFR): athlete enters coach mobile -> request created ->
    coach approves -> link established, coach name auto-populates, billing
    drops to the coached tier.
    """

    athlete = models.ForeignKey(
        AthleteProfile, on_delete=models.CASCADE, related_name='coach_links'
    )
    coach = models.ForeignKey(
        'coaching.CoachProfile', on_delete=models.CASCADE, related_name='athlete_links'
    )
    status = models.CharField(
        max_length=10, choices=AthleteLinkStatus.choices, default=AthleteLinkStatus.PENDING
    )
    requested_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']
        constraints = [
            models.UniqueConstraint(
                fields=['athlete', 'coach'],
                condition=models.Q(status='pending'),
                name='unique_pending_link_per_pair',
            )
        ]

    def __str__(self):
        return f'{self.athlete} -> {self.coach} [{self.status}]'

    def approve(self) -> None:
        self.status = AthleteLinkStatus.APPROVED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])
        # Establish the link on the athlete profile.
        self.athlete.coach = self.coach
        self.athlete.save(update_fields=['coach'])

    def reject(self) -> None:
        self.status = AthleteLinkStatus.REJECTED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])


class ParentChildLink(models.Model):
    """Parent → child connection request; the athlete approves (privacy)."""

    parent = models.ForeignKey(
        'coaching.ParentProfile', on_delete=models.CASCADE, related_name='child_links'
    )
    athlete = models.ForeignKey(
        AthleteProfile, on_delete=models.CASCADE, related_name='parent_links'
    )
    status = models.CharField(
        max_length=10, choices=AthleteLinkStatus.choices, default=AthleteLinkStatus.PENDING
    )
    requested_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f'{self.parent} -> {self.athlete} [{self.status}]'

    def approve(self) -> None:
        self.status = AthleteLinkStatus.APPROVED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])
        self.athlete.parent = self.parent
        self.athlete.save(update_fields=['parent'])

    def reject(self) -> None:
        self.status = AthleteLinkStatus.REJECTED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at'])
