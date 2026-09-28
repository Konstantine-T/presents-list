-- Run this in Supabase: Dashboard → SQL Editor → New query → paste everything → Run
-- Safe to re-run.

-- ============ gifts ============
create table if not exists public.gifts (
  id text primary key default gen_random_uuid()::text,
  section text not null check (section in ('birthday', 'abroad')),
  position int not null default 0,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.gifts enable row level security;

-- everyone can read, only the admin account can change
drop policy if exists "read gifts" on public.gifts;
drop policy if exists "admin writes gifts" on public.gifts;
create policy "read gifts" on public.gifts for select using (true);
create policy "admin writes gifts" on public.gifts for all
  to authenticated
  using ((auth.jwt() ->> 'email') = 'kostatavadze@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'kostatavadze@gmail.com');

-- ============ reservations ("ვყიდულობ") ============
create table if not exists public.reservations (
  gift_id text primary key,
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

-- anyone can see, add and remove reservations
drop policy if exists "read reservations" on public.reservations;
drop policy if exists "add reservations" on public.reservations;
drop policy if exists "update reservations" on public.reservations;
drop policy if exists "remove reservations" on public.reservations;
create policy "read reservations" on public.reservations for select using (true);
create policy "add reservations" on public.reservations for insert with check (true);
create policy "update reservations" on public.reservations for update using (true);
create policy "remove reservations" on public.reservations for delete using (true);

-- ============ initial list ============
insert into public.gifts (id, section, position, text) values
  ('flashlight', 'birthday', 1, 'თესლი ფანარი (მინიმუმ 2500 ლუმენი)'),
  ('frisbee', 'birthday', 2, 'ფრისბი'),
  ('harmonica', 'birthday', 3, 'ჰარმონიკა (A, G ან D ტონალობაში)'),
  ('ski-goggles', 'birthday', 4, 'სასრიალო სათვალე რამე თესლობა'),
  ('gerber-machete', 'birthday', 5, 'Gerber gator machete 65 cm (ამას გაფრო მაჩუქებს)'),
  ('kazoo', 'birthday', 6, 'კაზუ (ეს გურგენასთვის)'),
  ('album-cd', 'birthday', 7, 'ნებისმიერი ალბომის CD დისკი იმ ალბომებიდან, რომლებიც სფოთიფაის ბილბიოთეკაში მაქვს —-> https://docs.google.com/document/d/1v9B3sgXdnspFGex96qWXuPEwux392v7WIwqyYEoGQpc/edit?tab=t.0'),
  ('comic-bible', 'birthday', 8, 'ბიბლია, ოღონდ კომიქსებად რო იყოს დახატული'),
  ('ps1-controllers', 'birthday', 9, 'PS1ის ჯოისტიკები ან მემორი ქარდი'),
  ('ps1-game', 'birthday', 10, 'Ps1 ის თამაშის დისკი ნებისმიერის'),
  ('knife', 'birthday', 11, 'თესლი დანა (ქვემოთაა დალინკული, ან თქვენი გემოვნებით)'),
  ('ashtray', 'birthday', 12, 'თესლი საფერფლე (რო იშლება და ტრანსფორმერი რო ხდება, სამი სართული რო აქვს და რაღაც ეგეთი ყლეობები არა, იმენა კაი ძველი ჯიგრული საფერფლე)'),
  ('slackline', 'birthday', 13, 'Slackline (min 10 meters)'),
  ('curiosity-box', 'birthday', 14, 'Curiosity box by vsauce'),
  ('throwing-knives', 'birthday', 15, 'სასროლი დანები'),
  ('throwing-axes', 'birthday', 16, 'სასროლი ნაჯახი(ები)'),
  ('gopro-mounts', 'birthday', 17, 'გოუპროს ველოსიპედის მაუნთი, ტელეფონისაც'),
  ('lego-wrangler', 'birthday', 18, 'Lego Technic Jeep wrangler'),
  ('lego-technic', 'birthday', 19, 'Lego technic სერიიდან ნებისმიერიც მამენტ'),
  ('drink', 'birthday', 20, 'რამე თესლი სასმელი ერთი ბოთლი და დავლიოთ ეგრევე თუ გინდა'),
  ('statue', 'birthday', 21, 'ქანდაკება ნებისმიერი ვინმესი, ოღონდ ნამდვილი. აი იმენა ქანდაკება, ბიუსტი, რავიცი, ნებისმიერი სახის. მანამდე რომელიმე ქუჩაზეც თუ იდგა ვაფშე გაასწორებს. შოთას ძეგლი ტოპ, რორამე'),
  ('film-iso100', 'birthday', 22, 'iso 100 ფირები (ფირის კამერისთვის) შავთეთრი, ფერადი, ბრენდული, ვადიანი, ვადაგასული პოხუი, ლიჟბი ფირი იყოს მუშა.'),
  ('jbl-clip', 'birthday', 23, 'JBL clip ბოლოს გამოსული რაც იქნება ამ მომენტში, როცა ამას კითხულობ'),
  ('mini-fridge', 'birthday', 24, 'პატარა მაცივარი'),
  ('drill', 'birthday', 25, 'დრელი'),
  ('hammock', 'birthday', 26, 'ჰამაკი (თესლი)'),
  ('cap', 'birthday', 27, 'თესლი კეპკა'),
  ('julbo-glasses', 'birthday', 28, 'ჯულბოს მთის მზის სათვალე'),
  ('amazon-1', 'birthday', 29, 'აი ეს - https://a.co/d/0dWDEwJ9'),
  ('amazon-2', 'birthday', 30, 'ან ამეებიდან რომელიმე - https://a.co/d/0bzHDl8M'),
  ('wurkkos-ts22', 'birthday', 31, 'Wurkkos ts22 flashlight'),
  ('abroad-1', 'abroad', 1, 'წითელი მალბორო ან american spirit სიგარეტი'),
  ('abroad-2', 'abroad', 2, 'ნებისმიერი სიგარეტი უცხო'),
  ('abroad-3', 'abroad', 3, 'golden virginia tobacco (რაც მეტი, მით უკეთესი)'),
  ('abroad-4', 'abroad', 4, 'მედიატორი გიტარის'),
  ('abroad-5', 'abroad', 5, 'ლუდის კათხა (ქვეყნის სახელი რო ეწეროს არა, რამე მინიმალისტური და თან  თესლობა ერთად :დ)'),
  ('abroad-6', 'abroad', 6, 'თესლი კეპკა')
on conflict (id) do nothing;

-- a reservation disappears when its gift is deleted
delete from public.reservations where gift_id not in (select id from public.gifts);
alter table public.reservations drop constraint if exists reservations_gift_id_fkey;
alter table public.reservations add constraint reservations_gift_id_fkey
  foreign key (gift_id) references public.gifts (id) on delete cascade;

-- ============ live updates between open pages ============
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'gifts') then
    alter publication supabase_realtime add table public.gifts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'reservations') then
    alter publication supabase_realtime add table public.reservations;
  end if;
end $$;
