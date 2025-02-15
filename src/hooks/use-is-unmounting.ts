import * as React from 'react';

export function useIsUnmounting(): React.MutableRefObject<boolean> {
  const isUnmountingRef = React.useRef(false);
  React.useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  return isUnmountingRef;
}
