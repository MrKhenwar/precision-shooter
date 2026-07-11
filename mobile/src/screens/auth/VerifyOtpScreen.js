import React, { useState } from 'react';

import { Banner, Button, Field, Heading, Link, Screen } from '../../components/ui';
import { resendOtp, verifyOtp } from '../../api/auth';

export default function VerifyOtpScreen({ route, navigation }) {
  const { identifier, debugOtp } = route.params || {};
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(
    debugOtp ? `Dev OTP: ${debugOtp} (shown only in DEBUG mode)` : null
  );
  const [loading, setLoading] = useState(false);

  async function onVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(identifier, code.trim());
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      setError(e.response?.data?.detail || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      const data = await resendOtp(identifier);
      setInfo(data.debug_otp ? `New dev OTP: ${data.debug_otp}` : 'A new OTP has been sent.');
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not resend OTP.');
    }
  }

  return (
    <Screen>
      <Heading sub={`Enter the 6-digit code sent to ${identifier}`}>Verify your account</Heading>
      {info ? <Banner kind="info">{info}</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Field
        label="OTP"
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <Button title="Verify" onPress={onVerify} loading={loading} />
      <Link onPress={onResend}>Didn't get it? Resend OTP</Link>
    </Screen>
  );
}
