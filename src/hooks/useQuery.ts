import { useEffect } from 'react';
import { useQuery as useTanstackQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setLoading } from '../store/slices/uiSlice';

/**
 * Custom hook that wraps TanStack Query's useQuery with loading state management
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends [string, ...unknown[]] = [string, ...unknown[]]
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>,
  loadingKey?: string
): UseQueryResult<TData, TError> {
  const dispatch = useDispatch();
  const loadingStateKey = loadingKey || queryKey[0];
  
  // Get the query result
  const result = useTanstackQuery({
    queryKey,
    queryFn,
    ...options,
  });
  
  // Update loading state based on the query status
  useEffect(() => {
    dispatch(setLoading({ 
      key: loadingStateKey, 
      isLoading: result.isLoading || result.isFetching 
    }));
  }, [dispatch, loadingStateKey, result.isLoading, result.isFetching]);

  return result;
}

export default useQuery;