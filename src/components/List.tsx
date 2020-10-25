import * as React from 'react';

type Variant = 'ordered' | 'unordered';
export type IListProps = React.PropsWithChildren<
  {
    variant: Variant;
  } & React.ComponentProps<'ul'> &
    React.ComponentProps<'ol'>
>;

const variantTags: Record<Variant, 'ul' | 'ol'> = {
  ordered: 'ol',
  unordered: 'ul',
};

const variantStyles: Record<Variant, string> = {
  ordered: 'list-decimal',
  unordered: 'list-disc',
};

export function List({ className, variant, ...restProps }: IListProps): JSX.Element {
  const Tag = variantTags[variant];
  return (
    <Tag {...restProps} className={`py-2 list-inside ${variantStyles[variant]} ${className}`} />
  );
}

List.Item = ListItem;

export type IListItemProps = React.PropsWithChildren<React.ComponentPropsWithoutRef<'li'>>;

function ListItem({ className, children, ...liProps }: IListItemProps): JSX.Element {
  return (
    <li {...liProps} className={`text-text ${className}`}>
      {children}
    </li>
  );
}