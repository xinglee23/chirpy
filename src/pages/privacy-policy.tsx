import { GetStaticProps } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import * as React from 'react';
import 'twin.macro';

import { SiteLayout } from '$/blocks/layout';
import { MDXComponents } from '$/blocks/mdx-components';
import { getMDXPropsBySlug, MDXProps } from '$/server/mdx/mdx';

export default function PrivacyPolicy({ mdxSource, frontMatter }: MDXProps): JSX.Element {
  return (
    <SiteLayout title={frontMatter.title || 'Privacy policy'}>
      <section>
        <article tw="mx-auto prose lg:prose-xl py-16">
          <MDXRemote {...mdxSource} components={MDXComponents} />
        </article>
      </section>
    </SiteLayout>
  );
}

export const getStaticProps: GetStaticProps<MDXProps> = async () => {
  const privacyPolicyProps = await getMDXPropsBySlug('privacy-policy');
  return {
    props: {
      ...privacyPolicyProps,
    },
  };
};
