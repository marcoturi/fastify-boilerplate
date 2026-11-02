export interface Paginated<T> {
  count: number;
  limit: number;
  page: number;
  data: T[];
}

export interface PaginatedQueryParams {
  limit: number;
  page: number;
  offset: number;
}

export interface RepositoryPort<Entity> {
  insert(entity: Entity | Entity[]): Promise<void>;
  findOneById(id: string): Promise<Entity | undefined>;
  findAll(): Promise<Entity[]>;
  findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>>;
  update(entity: Entity): Promise<Entity>;
  delete(entityId: string): Promise<boolean>;
}
