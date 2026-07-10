import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('BuzzleInvoice')
export class BuzzleInvoiceDTO {
  @Field()
  id!: string;

  @Field()
  number!: string;

  @Field()
  date!: string;

  @Field({ nullable: true })
  dueDate?: string;

  @Field(() => Float)
  total!: number;

  @Field(() => Float)
  balance!: number;

  @Field()
  currency!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  downloadUrl?: string;
}
