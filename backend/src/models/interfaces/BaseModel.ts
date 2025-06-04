import { Model, Optional } from 'sequelize';

export interface BaseAttributes {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BaseCreationAttributes<T extends BaseAttributes> = Optional<T, keyof BaseAttributes>;

export interface BaseModelInterface<
  TAttributes extends BaseAttributes,
  TCreationAttributes extends {} = BaseCreationAttributes<TAttributes>
> extends Model<TAttributes, TCreationAttributes> {
  id: number;
  createdAt: Date;
  updatedAt: Date;
} 