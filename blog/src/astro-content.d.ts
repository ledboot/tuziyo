declare module "astro:content" {
  export const z: any
  export const defineCollection: any

  export type CollectionEntry<TCollection extends string> = {
    id: string
    slug: string
    collection: TCollection
    data: Record<string, unknown>
    body: string
  }
}
