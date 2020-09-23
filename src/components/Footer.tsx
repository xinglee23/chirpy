/** @jsx jsx */
import { jsx, NavLink } from 'theme-ui';
import * as React from 'react';
import Link from 'next/link';
import { layoutStyle } from './styles';

export function Footer(): JSX.Element {
  return (
    <footer sx={{ ...layoutStyle, paddingTop: 5, paddingBottom: 5 }}>
      <nav
        sx={{
          display: 'flex',
          '& > *': {
            marginRight: 4,
          },
        }}
      >
        <Link href="/">
          <NavLink>&copy; 2020 ZOO</NavLink>
        </Link>
        <Link href="/terms-of-service">
          <NavLink>Terms of Service</NavLink>
        </Link>
        <Link href="/privacy-policy">
          <NavLink>Privacy Policy</NavLink>
        </Link>
      </nav>
    </footer>
  );
}
