/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect, memo} from 'react';
import clsx from 'clsx';
import {
  isSamePath,
  usePrevious,
  Collapsible,
  useCollapsible,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/IconExternalLink';

import type {Props, DocSidebarItemsProps} from '@theme/DocSidebarItem';
import type {
  PropSidebarItem,
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';

import styles from './styles.module.css';

function containsActiveSidebarItem(
  items: PropSidebarItem[],
  activePath: string,
): boolean {
  return items.some((subItem) => isActiveSidebarItem(subItem, activePath));
}

function isActiveSidebarItem(
  item: PropSidebarItem,
  activePath: string,
): boolean {
  const isActive = (testedPath: string | undefined) =>
    typeof testedPath !== 'undefined' && isSamePath(testedPath, activePath);

  if (item.type === 'link') {
    return isActive(item.href);
  }

  if (item.type === 'category') {
    return (
      isActive(item.href) || containsActiveSidebarItem(item.items, activePath)
    );
  }

  return false;
}

// Optimize sidebar at each "level"
// TODO this item should probably not receive the "activePath" props
// TODO this triggers whole sidebar re-renders on navigation
export const DocSidebarItems = memo(
  ({items, ...props}: DocSidebarItemsProps): JSX.Element => (
    <>
      {items.map((item, index) => (
        <DocSidebarItem
          key={index} // sidebar is static, the index does not change
          item={item}
          {...props}
        />
      ))}
    </>
  ),
);

export default function DocSidebarItem({
  item,
  ...props
}: Props): JSX.Element | null {
  switch (item.type) {
    case 'category':
      if (item.items.length === 0) {
        return null;
      }
      return <DocSidebarItemCategory item={item} {...props} />;
    case 'link':
    default:
      return <DocSidebarItemLink item={item} {...props} />;
  }
}

// If we navigate to a category and it becomes active, it should automatically expand itself
function useAutoExpandActiveCategory({
  isActive,
  collapsed,
  setCollapsed,
}: {
  isActive: boolean;
  collapsed: boolean;
  setCollapsed: (b: boolean) => void;
}) {
  const wasActive = usePrevious(isActive);
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;
    if (justBecameActive && collapsed) {
      setCollapsed(false);
    }
  }, [isActive, wasActive, collapsed, setCollapsed]);
}

function DocSidebarItemCategory({
  item,
  onItemClick,
  activePath,
  level,
  ...props
}: Props & {item: PropSidebarItemCategory}) {
  const {items, label, collapsible, className, href} = item;

  const isActive = isActiveSidebarItem(item, activePath);

  const {collapsed, setCollapsed, toggleCollapsed} = useCollapsible({
    // active categories are always initialized as expanded
    // the default (item.collapsed) is only used for non-active categories
    initialState: () => {
      if (!collapsible) {
        return false;
      }
      return isActive ? false : item.collapsed;
    },
  });

  useAutoExpandActiveCategory({isActive, collapsed, setCollapsed});

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemCategory,
        ThemeClassNames.docs.docSidebarItemCategoryLevel(level),
        'menu__list-item',
        {
          'menu__list-item--collapsed': collapsed,
        },
        className,
      )}>
      <Link
        className={clsx('menu__link', {
          'menu__link--sublist': collapsible,
          'menu__link--active': collapsible && isActive,
          [styles.menuLinkText]: !collapsible,
        })}
        onClick={
          collapsible
            ? (e) => {
                if (href) {
                  setCollapsed(false);
                } else {
                  e.preventDefault();
                  toggleCollapsed();
                }
              }
            : undefined
        }
        href={collapsible ? href ?? '#' : href}
        {...props}>
        {label}
      </Link>

      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        <DocSidebarItems
          items={items}
          tabIndex={collapsed ? -1 : 0}
          onItemClick={onItemClick}
          activePath={activePath}
          level={level + 1}
        />
      </Collapsible>
    </li>
  );
}

function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  ...props
}: Props & {item: PropSidebarItemLink}) {
  const {href, label, className} = item;
  const isActive = isActiveSidebarItem(item, activePath);
  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx('menu__link', {
          'menu__link--active': isActive,
        })}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalUrl(href) && {
          onClick: onItemClick,
        })}
        {...props}>
        {isInternalUrl(href) ? (
          label
        ) : (
          <span>
            {label}
            <IconExternalLink />
          </span>
        )}
      </Link>
    </li>
  );
}
