export type Section = "birthday" | "abroad";

export type Gift = {
  id: string;
  section: Section;
  position: number;
  text: string;
};

export const sectionTitles: Record<Section, string> = {
  birthday:
    "რა შეგიძლია აჩუქო კონსტანტინე თავაძეს (დაბადების დღეზე, ან ისედაც, თუ გაგისწორდება)",
  abroad: "რა შეგიძლია ჩამოუტანო კონსტანტინე თავაძეს უცხო ქვეყნიდან",
};

export const ADMIN_EMAIL = "kostatavadze@gmail.com";
