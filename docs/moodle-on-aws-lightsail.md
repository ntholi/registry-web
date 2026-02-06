# Moodle on AWS Lightsail (Ubuntu + LAMP)

This guide walks through provisioning an AWS Lightsail Ubuntu instance, installing a LAMP stack, installing Moodle with the CLI installer, wiring cron, and enabling HTTPS. It includes both AWS CLI commands and Linux server commands.

## Prerequisites

- AWS account with Lightsail access.
- AWS CLI installed and configured on your local machine.
- A registered domain name (optional but recommended for HTTPS).
- Local SSH client.

## 1) Provision a Lightsail instance (AWS CLI)

Use AWS CLI to create the instance, open ports, and attach a static IP. Replace values in ALL_CAPS.

### 1.1 Create instance

Choose a Linux blueprint (for example: Ubuntu) and a bundle size that fits your load.

```bash
aws lightsail create-instances \
  --instance-names MOODLE-1 \
  --availability-zone REGION_AZ \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_3_0
```

If you are unsure about blueprint or bundle IDs, list them first:

```bash
aws lightsail get-blueprints
aws lightsail get-bundles
```

### 1.2 Open required ports

Open SSH (22), HTTP (80), and HTTPS (443).

```bash
aws lightsail open-instance-public-ports \
  --instance-name MOODLE-1 \
  --port-info fromPort=22,toPort=22,protocol=TCP

aws lightsail open-instance-public-ports \
  --instance-name MOODLE-1 \
  --port-info fromPort=80,toPort=80,protocol=TCP

aws lightsail open-instance-public-ports \
  --instance-name MOODLE-1 \
  --port-info fromPort=443,toPort=443,protocol=TCP
```

### 1.3 Allocate and attach a static IP

```bash
aws lightsail allocate-static-ip --static-ip-name MOODLE-STATIC-IP

aws lightsail attach-static-ip \
  --static-ip-name MOODLE-STATIC-IP \
  --instance-name MOODLE-1
```

### 1.4 Find the public IP

```bash
aws lightsail get-instances
```

### 1.5 SSH into the instance

Download your Lightsail default key pair from the Lightsail console, then connect:

```bash
ssh -i /path/to/LightsailDefaultKey.pem ubuntu@PUBLIC_IP
```

## 2) OS update and LAMP install

Update packages, then install the default LAMP stack.

```bash
sudo apt-get update
sudo apt-get install lamp-server^
```

Verify Apache is up:

```bash
curl -I http://localhost
```

## 3) Secure the database

MariaDB on Ubuntu uses the secure installation helper. Depending on version, the command is either `mariadb-secure-installation` or the legacy name.

```bash
sudo mariadb-secure-installation
```

Create a database and user for Moodle:

```bash
sudo mysql -u root
```

```sql
CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4) Download and place Moodle

Use the latest stable package from Moodle downloads.

```bash
cd /tmp
wget https://download.moodle.org/latest.tgz
sudo tar -xzf latest.tgz
sudo mv moodle /var/www/moodle
```

Create Moodle data directory and set permissions:

```bash
sudo mkdir -p /var/moodledata
sudo chown -R www-data:www-data /var/moodledata /var/www/moodle
sudo chmod -R 2770 /var/moodledata
```

## 5) Apache site configuration

Create an Apache vhost for Moodle.

```bash
sudo tee /etc/apache2/sites-available/moodle.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName YOUR_DOMAIN
    DocumentRoot /var/www/moodle

    <Directory /var/www/moodle>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/moodle-error.log
    CustomLog ${APACHE_LOG_DIR}/moodle-access.log combined
</VirtualHost>
EOF

sudo a2enmod rewrite
sudo a2ensite moodle
sudo a2dissite 000-default
sudo systemctl reload apache2
```

If you are not using a domain yet, you can temporarily set ServerName to the public IP.

## 6) Run the Moodle CLI installer

Moodle includes a CLI installer that creates config.php and initializes the database.

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/install.php \
  --lang=en \
  --wwwroot=http://YOUR_DOMAIN \
  --dataroot=/var/moodledata \
  --dbtype=mariadb \
  --dbhost=localhost \
  --dbname=moodle \
  --dbuser=moodle \
  --dbpass='STRONG_PASSWORD_HERE' \
  --fullname='Your Moodle Site' \
  --shortname='Moodle' \
  --adminuser=admin \
  --adminpass='STRONG_ADMIN_PASSWORD' \
  --adminemail=admin@example.com \
  --agree-license \
  --non-interactive
```

## 7) Configure cron

Moodle requires cron to run every minute.

```bash
sudo crontab -u www-data -e
```

Add this line:

```bash
* * * * * /usr/bin/php /var/www/moodle/admin/cli/cron.php >/dev/null
```

You can list or run tasks manually if needed:

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/cron.php --list
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/scheduled_task.php --list
```

## 8) Enable HTTPS (Certbot + Apache)

Install Certbot via snap and enable HTTPS.

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --apache
sudo certbot renew --dry-run
```

## 9) Post-install checks

- Visit http://YOUR_DOMAIN and https://YOUR_DOMAIN.
- Log in as the admin user and complete any web-based setup prompts.
- Check the scheduled task status in Site administration > Server > Tasks.

## 10) Upgrades (CLI)

When upgrading Moodle, use the CLI upgrader.

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/upgrade.php
```

## Sources

- AWS CLI Lightsail reference: https://docs.aws.amazon.com/cli/latest/reference/lightsail/index.html
- AWS CLI create instances: https://docs.aws.amazon.com/cli/latest/reference/lightsail/create-instances.html
- AWS CLI open ports: https://docs.aws.amazon.com/cli/latest/reference/lightsail/open-instance-public-ports.html
- AWS CLI allocate static IP: https://docs.aws.amazon.com/cli/latest/reference/lightsail/allocate-static-ip.html
- AWS CLI attach static IP: https://docs.aws.amazon.com/cli/latest/reference/lightsail/attach-static-ip.html
- Ubuntu LAMP stack commands: https://help.ubuntu.com/community/ApacheMySQLPHP
- Moodle CLI installer options: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/install.php
- Moodle CLI cron: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/cron.php
- Moodle scheduled tasks CLI: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/scheduled_task.php
- Moodle CLI upgrade: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/upgrade.php
- Certbot Apache instructions: https://certbot.eff.org/instructions?ws=apache&os=ubuntufocal
- MariaDB secure installation notes: https://mariadb.com/kb/en/mysql_secure_installation/
