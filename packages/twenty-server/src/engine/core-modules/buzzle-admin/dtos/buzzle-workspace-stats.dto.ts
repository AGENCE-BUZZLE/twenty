import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('BuzzleWorkspaceStats')
export class BuzzleWorkspaceStatsDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field()
  displayName: string;

  @Field()
  subdomain: string;

  @Field()
  activationStatus: string;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  lastActivityAt?: Date;

  @Field({ nullable: true })
  hasContactObject?: boolean;
}
