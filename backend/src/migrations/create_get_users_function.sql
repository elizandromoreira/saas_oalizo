-- Função para buscar usuários pelo ID
-- Esta função contorna as restrições de acesso entre schemas
CREATE OR REPLACE FUNCTION public.get_users_by_ids(user_ids UUID[])
RETURNS JSONB
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', au.id,
        'email', au.email,
        'user_metadata', au.raw_user_meta_data
      )
    )
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
$$;

-- Conceder permissão para função ser executada por authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_by_ids(UUID[]) TO authenticated; 