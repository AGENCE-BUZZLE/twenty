import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class BuzzleCreateWorkspaceFromTemplateInput {
  @Field()
  displayName: string;

  @Field({
    description:
      'Subdomain slug, e.g. "bf-menuiseries". Will become {subdomain}.crm.agence-buzzle.com',
  })
  subdomain: string;

  @Field({
    description:
      'Template identifier, e.g. "leads-google-ads", "leads-meta-ads", "leads-mixed"',
  })
  templateId: string;

  @Field({
    description:
      'Email of the workspace owner (will receive invite). Defaults to super admin if omitted.',
    nullable: true,
  })
  ownerEmail?: string;
}
