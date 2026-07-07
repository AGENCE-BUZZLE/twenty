import { styled } from '@linaria/react';

import { useBuzzleWorkspaces } from '@/buzzle-admin/hooks/useBuzzleWorkspaces';

// Buzzle SuperAdmin Cockpit — landing page for Clément
// as agency owner. Lists all workspaces + basic stats, entry
// point for creating new workspaces and impersonating users.
//
// V3-early scaffold. Full visual design (Schemata palette, Inter
// Tight, hairlines, kanban preview per workspace) comes in next
// sprints.

const Container = styled.div`
  padding: 32px 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0;
`;

const Subtitle = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.6;
`;

const CreateButton = styled.button`
  background: #5b4bff;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d6d2c7;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #d6d2c7;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #14141c;
  opacity: 0.6;
  font-weight: 500;
`;

const Td = styled.td`
  padding: 14px 16px;
  border-bottom: 1px solid #efede6;
  font-size: 13px;
`;

const Badge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid #d6d2c7;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 0;
  opacity: 0.6;
`;

export const BuzzleCockpit = () => {
  const { workspaces, loading, error, refetch } = useBuzzleWorkspaces();

  return (
    <Container>
      <Header>
        <div>
          <Subtitle>Cockpit · Agence Buzzle</Subtitle>
          <Title>Mes workspaces clients</Title>
        </div>
        <CreateButton onClick={() => alert('Sprint S4 part 2 — création workspace à venir')}>
          + Nouveau workspace
        </CreateButton>
      </Header>

      {error && (
        <EmptyState>
          Erreur chargement workspaces: {error.message}
          <br />
          <button onClick={() => refetch()}>Réessayer</button>
        </EmptyState>
      )}

      {!error && (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Sous-domaine</Th>
              <Th>Statut</Th>
              <Th>Users</Th>
              <Th>Créé le</Th>
            </tr>
          </thead>
          <tbody>
            {loading && workspaces.length === 0 && (
              <tr>
                <Td colSpan={5}>
                  <EmptyState>Chargement…</EmptyState>
                </Td>
              </tr>
            )}
            {!loading && workspaces.length === 0 && (
              <tr>
                <Td colSpan={5}>
                  <EmptyState>Aucun workspace pour l'instant.</EmptyState>
                </Td>
              </tr>
            )}
            {workspaces.map((w) => (
              <tr key={w.id}>
                <Td>{w.displayName}</Td>
                <Td>
                  <a
                    href={`https://${w.subdomain}.crm.agence-buzzle.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {w.subdomain}
                  </a>
                </Td>
                <Td>
                  <Badge status={w.activationStatus}>{w.activationStatus}</Badge>
                </Td>
                <Td>{w.totalUsers}</Td>
                <Td>{new Date(w.createdAt).toLocaleDateString('fr-FR')}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};
