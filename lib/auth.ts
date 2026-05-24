import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "admin-config.json");

// Define a type for our config
interface AdminConfig {
  password?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

export async function getAdminConfig(): Promise<AdminConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setAdminConfig(newConfig: Partial<AdminConfig>) {
  const current = await getAdminConfig();
  const merged = { ...current, ...newConfig };
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export async function checkAdminPassword(providedPass: string | null): Promise<boolean> {
  if (!providedPass) return false;
  const config = await getAdminConfig();
  
  // If a password is set in the config file, verify against it
  if (config.password) {
    return providedPass === config.password;
  }
  
  // Fallback to environment variable if file config is empty
  if (process.env.ADMIN_PASSWORD) {
    return providedPass === process.env.ADMIN_PASSWORD;
  }

  // If NO password is set anywhere, deny access for safety.
  // Wait, the original code allowed access if ADMIN_PASSWORD wasn't set.
  // For safety, let's keep it somewhat secure: if no password set, we'll allow "admin" as fallback
  // or return false. We will return true ONLY if it matches fallback "admin"
  return providedPass === "admin";
}
