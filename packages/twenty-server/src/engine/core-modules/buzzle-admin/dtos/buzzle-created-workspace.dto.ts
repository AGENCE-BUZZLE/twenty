import { Field, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('BuzzleCreatedWorkspace')
export class BuzzleCreatedWorkspaceDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  displayName: string;

  @Field()
  subdomain: string;

  @Field()
  url: string;

  @Field()
  templateId: string;

  @Field(() => [String], {
    description:
      'Steps applied by the template (e.g. objects created, statuses, webhooks). Useful for audit and debug.',
  })
  appliedSteps: string[];
}
