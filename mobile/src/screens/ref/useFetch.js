// Tiny data-fetch hook: runs the async loaders on focus, exposes
// { data, loading, error, reload }. `loaders` is an object of key → fn.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useFetch(loaders, deps = []) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const run = useCallback(() => {
    let active = true;
    setLoading(true);
    const keys = Object.keys(loaders);
    Promise.allSettled(keys.map((k) => loaders[k]())).then((res) => {
      if (!active) return;
      const out = {};
      let firstErr = null;
      res.forEach((r, i) => {
        if (r.status === 'fulfilled') out[keys[i]] = r.value;
        else {
          out[keys[i]] = null;
          if (!firstErr) firstErr = r.reason;
        }
      });
      setData(out);
      setError(firstErr);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(run);

  return { data, loading, error, reload: run };
}
