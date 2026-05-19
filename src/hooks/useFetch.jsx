import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '../services/api';

export default function useFetch(
  endpoint,
  options = {},
  autoFetch = true
) {

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(autoFetch);

  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {

    try {

      setLoading(true);

      setError(null);

      const result = await apiFetch(
        endpoint,
        options
      );

      setData(result);

      return result;

    } catch (err) {

      setError(err);

      return null;

    } finally {

      setLoading(false);

    }

  }, [endpoint]);

  useEffect(() => {

    if (autoFetch) {
      fetchData();
    }

  }, [fetchData, autoFetch]);

  return {

    data,

    loading,

    error,

    refetch: fetchData,

  };

}