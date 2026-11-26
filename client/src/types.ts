export type AppRole = "manager" | "tenant";
export type Profile = { id: string; role: AppRole; display_name: string | null };
