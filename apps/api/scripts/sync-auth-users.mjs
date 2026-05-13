import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(process.cwd(), "scripts", "auth-users.example.json");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Faltan SUPABASE_URL y una key elevada de Supabase (SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY).",
  );
}

const users = JSON.parse(await readFile(inputPath, "utf8"));

if (!Array.isArray(users) || users.length === 0) {
  throw new Error(`El archivo ${inputPath} no contiene usuarios para sincronizar.`);
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

for (const user of users) {
  validateUser(user);
  const existingUser = await findUserByEmail(user.email);

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: user.email,
      password: user.password,
      email_confirm: user.emailConfirm ?? true,
      app_metadata: user.appMetadata ?? {},
      user_metadata: user.userMetadata ?? {},
    });

    if (error) {
      throw new Error(`No se pudo actualizar ${user.email}: ${error.message}`);
    }

    console.log(`updated ${user.email}`);
    continue;
  }

  const { error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: user.emailConfirm ?? true,
    app_metadata: user.appMetadata ?? {},
    user_metadata: user.userMetadata ?? {},
  });

  if (error) {
    throw new Error(`No se pudo crear ${user.email}: ${error.message}`);
  }

  console.log(`created ${user.email}`);
}

async function findUserByEmail(email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`No se pudo listar usuarios de Supabase: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      return user;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

function validateUser(user) {
  if (!user || typeof user !== "object") {
    throw new Error("Cada usuario debe ser un objeto.");
  }

  if (typeof user.email !== "string" || !user.email.trim()) {
    throw new Error("Cada usuario debe incluir un email valido.");
  }

  if (typeof user.password !== "string" || user.password.length < 8) {
    throw new Error(`El usuario ${user.email} necesita un password de al menos 8 caracteres.`);
  }
}
