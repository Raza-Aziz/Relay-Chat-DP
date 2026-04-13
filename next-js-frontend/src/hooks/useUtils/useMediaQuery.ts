import { useEffect, useState } from 'react';

// Custom hook to detect media query matches (screen size) and react to changes
export const useMediaQuery = (number: number) => {

  // Construct the media query string based on the passed number
  // E.g., if number = 640, the query will be `(max-width:639px)` which matches screens with widths <= 639px
  const query = `(max-width:${number - 1}px)`;

  // Initialize state to false. We cannot access `window` during SSR (Next.js server render),
  // so we defer the real check to the useEffect below which runs only in the browser.
  const [isMatches, setIsMatches] = useState<boolean>(false);

  useEffect(() => {
    // Create a MediaQueryList object that listens to changes in the media query match
    const mediaQuery = window.matchMedia(query);

    // Set the initial value now that we are in the browser
    setIsMatches(mediaQuery.matches);

    // Handler function to be called when the media query matches or doesn't match
    const handleMediaQueryChange = (event: MediaQueryListEvent | MediaQueryList) => {
      // Update the state to reflect whether the media query matches or not
      setIsMatches(event.matches);
    };

    // Attach the event listener to monitor changes in the media query match status
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Cleanup function to remove the event listener when the component is unmounted or the query changes
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };

  }, [query]); // The effect depends on 'query', so it will run when the query changes (if number changes)

  // Return the current status of whether the media query matches
  return isMatches;
};
