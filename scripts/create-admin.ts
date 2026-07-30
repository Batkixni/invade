import { auth } from "../src/lib/auth";

async function main() {
  const email = process.argv[2] || "admin@invade.tw";
  const password = process.argv[3] || "admin123456";
  const name = process.argv[4] || "Admin";

  console.log(`Creating admin user: ${email}...`);

  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    console.log("✅ Admin account created successfully!", res);
  } catch (e: any) {
    console.error("❌ Failed to create admin account:", e?.message || e);
  }
}

main();
