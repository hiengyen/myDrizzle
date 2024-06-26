import { db } from '../dbs/db'
import { and, eq } from 'drizzle-orm'
import { ProviderInsertDTO, ProviderDTO } from '../dto/providerDTO'
import { ProviderTable } from '../dbs/schema'

const getProviderByID = async (
  providerID: string,
): Promise<ProviderDTO | undefined> => {
  const searchingProvider: ProviderDTO | undefined =
    await db.query.ProviderTable.findFirst({
      where: eq(ProviderTable.providerID, providerID),
    })
  return searchingProvider
}

const getProviderByName = async (
  providerName: string,
): Promise<ProviderDTO[]> => {
  const providerInDB: ProviderDTO[] = await db
    .select()
    .from(ProviderTable)
    .where(eq(ProviderTable.providerName, providerName))

  return providerInDB
}

const insertProvider = async (provider: ProviderInsertDTO) => {
  await db.insert(ProviderTable).values({
    providerName: provider.providerName,
  })
}

const getProviders = async (): Promise<ProviderDTO[] | undefined> => {
  const providers: ProviderDTO[] = await db.select().from(ProviderTable)

  return providers
}

const deleteProvider = async (
  providerID: string,
): Promise<string | undefined> => {
  const deletedProviderID: { id: string }[] = await db
    .delete(ProviderTable)
    .where(eq(ProviderTable.providerID, providerID))
    .returning({ id: ProviderTable.providerID })

  if (!deletedProviderID || deletedProviderID.length === 0) {
    return undefined
  }
  return deletedProviderID[0].id
}

const updateProvider = async (
  provider: ProviderDTO,
): Promise<ProviderDTO | undefined> => {
  const updatedProvider: ProviderDTO[] = await db
    .update(ProviderTable)
    .set({
      providerName: provider.providerName,
    })
    .where(and(eq(ProviderTable.providerID, provider.providerID)))
    .returning()

  if (!updatedProvider || updatedProvider.length === 0) {
    return undefined
  }
  return updatedProvider[0]
}

export default {
  getProviderByID,
  getProviderByName,
  insertProvider,
  updateProvider,
  deleteProvider,
  getProviders,
}
