create table profiles(id uuid primary key references auth.users on delete cascade, full_name text, phone text, is_admin boolean not null default false);
create table trips(id uuid primary key default gen_random_uuid(), title text not null, description text, trip_date date not null, departure text, price int not null, seats_total int not null, status text not null default 'open');
create table bookings(id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles(id), trip_id uuid not null references trips(id), seats int not null check(seats>0), total int not null, deposit int not null, paid int not null default 0, status text not null default 'pending', created_at timestamptz not null default now());
create table payments(id uuid primary key default gen_random_uuid(), booking_id uuid not null references bookings(id), amount int not null, kind text not null, phone text, checkout_id text unique, mpesa_ref text, status text not null default 'initiated', created_at timestamptz not null default now());
create sequence receipt_seq;
create table receipts(id uuid primary key default gen_random_uuid(), number text unique not null default 'DEX-'||lpad(nextval('receipt_seq')::text,6,'0'), payment_id uuid unique references payments(id), booking_id uuid references bookings(id), amount int, balance int, created_at timestamptz not null default now());

create function is_admin() returns boolean language sql security definer stable as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function handle_new_user() returns trigger language plpgsql security definer as $$ begin insert into profiles(id,full_name,phone) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone'); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security; alter table trips enable row level security; alter table bookings enable row level security; alter table payments enable row level security; alter table receipts enable row level security;
create policy "own profile" on profiles for select using (id=auth.uid() or is_admin());
create policy "trips public" on trips for select using (true);
create policy "admin trips" on trips for all using (is_admin()) with check (is_admin());
create policy "own bookings" on bookings for select using (user_id=auth.uid() or is_admin());
create policy "own payments" on payments for select using (exists(select 1 from bookings b where b.id=booking_id and (b.user_id=auth.uid() or is_admin())));
create policy "own receipts" on receipts for select using (exists(select 1 from bookings b where b.id=booking_id and (b.user_id=auth.uid() or is_admin())));

create view trip_availability as select t.*, t.seats_total - coalesce((select sum(seats) from bookings b where b.trip_id=t.id and (b.status in ('deposit_paid','paid') or (b.status='pending' and b.created_at>now()-interval '15 minutes'))),0)::int as seats_left from trips t;
grant select on trip_availability to anon, authenticated;

-- Books seats and holds them 15 minutes; deposit is 40%.
create function book_trip(p_trip uuid, p_seats int) returns uuid language plpgsql security definer as $$
declare t trips; taken int; bid uuid; tot int;
begin
  if auth.uid() is null then raise exception 'Sign in to book'; end if;
  select * into t from trips where id=p_trip and status='open' for update;
  if not found then raise exception 'This trip is not open for booking'; end if;
  select coalesce(sum(seats),0) into taken from bookings where trip_id=p_trip and (status in ('deposit_paid','paid') or (status='pending' and created_at>now()-interval '15 minutes'));
  if taken+p_seats>t.seats_total then raise exception 'Not enough seats left'; end if;
  tot:=t.price*p_seats;
  insert into bookings(user_id,trip_id,seats,total,deposit) values(auth.uid(),p_trip,p_seats,tot,ceil(tot*0.4)) returning id into bid;
  return bid;
end $$;

insert into trips(title,description,trip_date,departure,price,seats_total) values
('Fourteen Falls, Thika','One day trip: transport, music, professional photos, entrance fee and swimming.','2026-11-28','Chuka',2800,40);
-- After signing up, make yourself admin:  update profiles set is_admin=true where full_name='YOUR NAME';
