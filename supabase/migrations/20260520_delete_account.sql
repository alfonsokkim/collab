-- Allows a user to delete their own account from the client
create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Only the authenticated user themselves can call this
revoke all on function delete_account() from public;
grant execute on function delete_account() to authenticated;
