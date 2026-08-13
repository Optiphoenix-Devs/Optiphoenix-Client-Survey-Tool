# MySQL setup on Mac — XAMPP (recommended)

You do **not** need Xcode for this project. Xcode only came up because **Homebrew** could not install MySQL without Apple developer tools on your laptop.

**XAMPP** is easier: one installer, a control panel, MySQL + phpMyAdmin (visual DB UI). Perfect if you already know that workflow.

---

## Option A: XAMPP (use this)

### 1. Download and install XAMPP

1. Go to: https://www.apachefriends.org/
2. Download **XAMPP for macOS** (Intel chip version for MacBook Air 2017)
3. Install the `.dmg` like any normal Mac app
4. Open **XAMPP** from Applications

### 2. Start MySQL

1. Open **XAMPP Control Panel** (or Manager)
2. Click **Start** next to **MySQL**
3. Status should show MySQL as running (green / started)

You do **not** need to start Apache unless you want phpMyAdmin in the browser (phpMyAdmin uses Apache).

### 3. Create the database

**Way 1 — phpMyAdmin (GUI, easiest)**

1. In XAMPP, start **Apache** and **MySQL**
2. Open browser: http://localhost/phpmyadmin
3. Click **Databases** → create database named: `optiphoenix_survey`
4. Collation: `utf8mb4_unicode_ci` (default is fine)

**Way 2 — Terminal**

```bash
/Applications/XAMPP/xamppfiles/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS optiphoenix_survey;"
```

Default XAMPP MySQL user: `root`  
Default password: **empty** (blank)

### 4. Configure the Next.js app

```bash
cd /Users/safatkamal/Desktop/ABTests/Optiphoenix-Client-Survey-Tool
cp .env.example .env
```

Your `.env` should look like:

```
DATABASE_URL="mysql://root@localhost:3306/optiphoenix_survey"
```

If you set a root password in XAMPP:

```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/optiphoenix_survey"
```

### 5. Create tables (Prisma migration)

Make sure MySQL is **running** in XAMPP, then:

```bash
cd /Users/safatkamal/Desktop/ABTests/Optiphoenix-Client-Survey-Tool
npx prisma migrate dev --name init
```

### 6. View your tables

**phpMyAdmin:** http://localhost/phpmyadmin → database `optiphoenix_survey` → tables: User, Form, Question, Response, Answer

**Or Prisma Studio:**

```bash
npx prisma studio
```

Opens http://localhost:5555

---

## Option B: Homebrew MySQL (optional, not required)

Only use this if you prefer Terminal-only setup and can fix Homebrew/Xcode tools.

```bash
brew install mysql
brew services start mysql
mysql -u root -e "CREATE DATABASE IF NOT EXISTS optiphoenix_survey;"
```

If `brew install mysql` fails with “No developer tools installed”, that is a **Homebrew** issue, not a Next.js issue. Use XAMPP instead.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Can't reach database server at localhost:3306` | Start MySQL in XAMPP control panel |
| Port 3306 in use | Another MySQL may be running; stop it or change XAMPP MySQL port in config |
| Access denied for user 'root' | Check password in `.env` matches XAMPP |
| phpMyAdmin won’t open | Start **Apache** and **MySQL** in XAMPP |

---

## Quick checklist

- [ ] XAMPP installed
- [ ] MySQL **Started** in XAMPP
- [ ] Database `optiphoenix_survey` created
- [ ] `.env` has correct `DATABASE_URL`
- [ ] `npx prisma migrate dev --name init` succeeds
