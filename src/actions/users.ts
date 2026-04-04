'use server'

export async function getUserProfile() {
  // TODO: Implementar backend
  return { data: null, error: null }
}

export async function updateProfile(_data: {
  name?: string
  phone?: string
  address?: string
  photo?: string
}) {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function deleteAccount() {
  throw new Error('Not implemented - run /auto-flow execute')
}

export async function getUserById(_id: string) {
  // TODO: Implementar backend
  return { data: null, error: null }
}

// RESOLVED: upload de foto para Supabase Storage
// Recebe o arquivo como base64/FormData; retorna a URL pública
// TODO: Substituir pelo upload real via Supabase client quando integrado:
//   const supabase = createServerClient(...)
//   const { data, error } = await supabase.storage.from('avatars').upload(path, file)
//   const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
export async function uploadPhoto(_formData: FormData): Promise<{ data: { url: string } | null; error: string | null }> {
  // Stub: retorna null até Supabase Storage estar integrado
  return { data: null, error: null }
}
