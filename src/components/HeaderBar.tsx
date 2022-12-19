/// <reference types="vite-plugin-svgr/client" />

import { Burger, Container, createStyles, Group, Menu, Tabs, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { formatHumanName, ProfileResource } from '@medplum/core';
import { HumanName } from '@medplum/fhirtypes';
import { ResourceAvatar, useMedplumProfile } from '@medplum/react';
import {
  IconChevronDown,
  IconHeart,
  IconLogout,
  IconMessage,
  IconPlayerPause,
  IconSettings,
  IconStar,
  IconSwitchHorizontal,
  IconTrash,
} from '@tabler/icons';
import React, { useState } from 'react';
import { Link, Location, useLocation, useNavigate } from 'react-router-dom';
import { ReactComponent as Logo } from './logo-white.svg';

const useStyles = createStyles((theme) => ({
  header: {
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
    borderBottom: `1px solid ${theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background}`,
  },

  mainSection: {
    paddingBottom: theme.spacing.sm,
  },

  user: {
    color: theme.white,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radius.sm,
    transition: 'background-color 100ms ease',

    '&:hover': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
        0.1
      ),
    },

    [theme.fn.smallerThan('xs')]: {
      display: 'none',
    },
  },

  burger: {
    [theme.fn.largerThan('xs')]: {
      display: 'none',
    },
  },

  userActive: {
    backgroundColor: theme.fn.lighten(
      theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
      0.1
    ),
  },

  tabs: {
    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },

  tabsList: {
    borderBottom: '0 !important',
  },

  tab: {
    fontWeight: 500,
    // minor adjustment fixes tab underline not showing.
    height: 37,
    marginBottom: 1,
    color: theme.white,
    backgroundColor: 'transparent',
    borderColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,

    '&:hover': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
        0.1
      ),
    },

    '&[data-active]': {
      backgroundColor: theme.fn.lighten(
        theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background!,
        0.1
      ),
      borderColor: theme.fn.variant({ variant: 'filled', color: theme.primaryColor }).background,
    },
  },
}));

const tabs: Record<string, string> = {
  Worklist: '/',
  Patients: '/patients',
  Visits: '/visits',
  Forms: '/forms',
  Reports: '/reports',
  'Care Plans': '/careplans',
  Messages: '/messages',
  Rx: '/rx',
  'Transition of Care': '/Questionnaire/d582df91-be08-420a-80e1-e5ee0aff250c',
  'Send Message': '/Questionnaire/f1b01312-662c-4fad-80af-53ef1eb319c2',
};

export function HeaderBar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useMedplumProfile() as ProfileResource;
  const { classes, theme, cx } = useStyles();
  const [opened, { toggle }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  const items = Object.keys(tabs).map((tab) => (
    <Tabs.Tab value={tab} key={tab}>
      {tab}
    </Tabs.Tab>
  ));

  return (
    <div className={classes.header}>
      <Container fluid className={classes.mainSection}>
        <Group position="apart">
          <Link to="/">
            <Logo style={{ width: 105, height: 18 }} />
          </Link>

          <Burger opened={opened} onClick={toggle} className={classes.burger} size="sm" color={theme.white} />

          <Menu
            width={260}
            position="bottom-end"
            transition="pop-top-right"
            shadow="xl"
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
          >
            <Menu.Target>
              <UnstyledButton className={cx(classes.user, { [classes.userActive]: userMenuOpened })}>
                <Group spacing={7}>
                  <ResourceAvatar value={profile} radius="xl" size={20} />
                  <Text weight={500} size="sm" sx={{ lineHeight: 1, color: theme.white }} mr={3}>
                    {formatHumanName(profile.name?.[0] as HumanName)}
                  </Text>
                  <IconChevronDown size={12} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item icon={<IconHeart size={14} stroke={1.5} color={theme.colors.red[6]} />}>Liked posts</Menu.Item>
              <Menu.Item icon={<IconStar size={14} stroke={1.5} color={theme.colors.yellow[6]} />}>
                Saved posts
              </Menu.Item>
              <Menu.Item icon={<IconMessage size={14} stroke={1.5} color={theme.colors.blue[6]} />}>
                Your comments
              </Menu.Item>

              <Menu.Label>Settings</Menu.Label>
              <Menu.Item icon={<IconSettings size={14} stroke={1.5} />}>Account settings</Menu.Item>
              <Menu.Item icon={<IconSwitchHorizontal size={14} stroke={1.5} />}>Change account</Menu.Item>
              <Menu.Item icon={<IconLogout size={14} stroke={1.5} />}>Logout</Menu.Item>

              <Menu.Divider />

              <Menu.Label>Danger zone</Menu.Label>
              <Menu.Item icon={<IconPlayerPause size={14} stroke={1.5} />}>Pause subscription</Menu.Item>
              <Menu.Item color="red" icon={<IconTrash size={14} stroke={1.5} />}>
                Delete account
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Container>
      <Container>
        <Tabs
          variant="outline"
          value={getActiveTab(location)}
          onTabChange={(value: string) => navigate(tabs[value])}
          classNames={{
            root: classes.tabs,
            tabsList: classes.tabsList,
            tab: classes.tab,
          }}
        >
          <Tabs.List>{items}</Tabs.List>
        </Tabs>
      </Container>
    </div>
  );
}

function getActiveTab(location: Location): string {
  const currentPath = location.pathname;
  let bestTab = 'Worklist';
  let bestCount = 0;

  for (const [tab, url] of Object.entries(tabs)) {
    if (currentPath.startsWith(url) && url.length > bestCount) {
      bestTab = tab;
      bestCount = url.length;
    }
  }

  return bestTab;
}
