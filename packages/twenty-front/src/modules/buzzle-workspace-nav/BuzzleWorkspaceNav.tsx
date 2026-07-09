import { styled } from '@linaria/react';
import { useLocation, useNavigate } from 'react-router-dom';

// Hardcoded Buzzle navigation shown at the top of the workspace nav drawer.
// Replaces Twenty's dynamic object-driven nav (which is filtered to hide
// all default objects). Renders a fixed set of Buzzle-specific pages that
// every workspace has: Contacts, Pipeline, Rapports + user account.
//
// NOTE: The routes below don't all resolve yet — /contacts, /pipeline,
// /reports are planned pages that consume the Contact object once Sprint
// S4 stage 3 provisions it. For now, "Vue d'ensemble" is the only
// functional entry; the others are visual placeholders.

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
  margin-bottom: 18px;
`;

const Label = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #14141c;
  opacity: 0.55;
  padding: 4px 10px;
  margin-bottom: 4px;
`;

const Item = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  color: #14141c;
  ${({ isActive }) => isActive && `
    background: #efede6;
    font-weight: 500;
  `}
  &:hover { background: #efede6; }
`;

const Icon = styled.span`
  opacity: 0.55;
  font-size: 12px;
  width: 16px;
  text-align: center;
`;

const Count = styled.span`
  margin-left: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  opacity: 0.5;
`;

const items = [
  { label: 'Vue d\'ensemble', icon: '◉', path: '/' },
  { label: 'Contacts', icon: '☰', path: '/contacts' },
  { label: 'Pipeline', icon: '⚡', path: '/pipeline' },
  { label: 'Rapports', icon: '📊', path: '/reports' },
];

const accountItems = [
  { label: 'Mon profil', icon: '👤', path: '/settings/profile' },
  { label: 'Contacter Buzzle', icon: '💬', path: 'mailto:contact@agence-buzzle.com' },
];

export const BuzzleWorkspaceNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (path: string) => {
    if (path.startsWith('mailto:')) {
      window.location.href = path;

      return;
    }
    navigate(path);
  };

  return (
    <>
      <Section>
        <Label>Espace</Label>
        {items.map((item) => (
          <Item
            key={item.path}
            isActive={location.pathname === item.path}
            onClick={() => handleClick(item.path)}
          >
            <Icon>{item.icon}</Icon>
            {item.label}
          </Item>
        ))}
      </Section>
      <Section>
        <Label>Compte</Label>
        {accountItems.map((item) => (
          <Item
            key={item.path}
            isActive={location.pathname === item.path}
            onClick={() => handleClick(item.path)}
          >
            <Icon>{item.icon}</Icon>
            {item.label}
          </Item>
        ))}
      </Section>
    </>
  );
};
