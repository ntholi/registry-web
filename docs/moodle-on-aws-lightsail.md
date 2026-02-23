# Step-by-step Installation Guide for Ubuntu - MoodleDocs (Nginx + MariaDB)

This guide reflects the MoodleDocs content for Ubuntu, using Nginx, PHP-FPM, and MariaDB.

## 1) Development Database Installation

This guide requires a Linux Ubuntu 24 server with sudo or root access. All commands on this page are text based so there is no need for a desktop with a graphical interface. Each step will tell you what you need to do and then give the commands that will accomplish that step. You can copy the entire coloured step or a line at a time but be careful with the word wrap, some commands will extend over multiple lines.

### 1.1 Update and install base packages

Moodle requires a web server, database and the php scripting language as described in https://moodledev.io/general/releases/5.0#server-requirements.

```bash
# Set your domain name or IP address as a temporary variable as it will be needed several times in the installation
PROTOCOL="https://";
read -p "Enter the web address (without the protocol prefix, eg domain name mymoodle123.com or IP address 192.168.1.1.): " WEBSITE_ADDRESS

MOODLE_PATH="/var/www/html/sites"
MOODLE_CODE_FOLDER="$MOODLE_PATH/moodle"
MOODLE_DATA_FOLDER="/var/www/data"
sudo mkdir -p $MOODLE_PATH
sudo mkdir -p $MOODLE_DATA_FOLDER
```

```bash
# Refresh and download latest versions of all packages
sudo apt-get update && sudo apt upgrade -y
# Get php-fpn and required php extensions using the package manager apt-get
sudo apt-get install -y php8.3-fpm php8.3-cli php8.3-curl php8.3-zip php8.3-gd php8.3-xml php8.3-intl php8.3-mbstring php8.3-xmlrpc php8.3-soap php8.3-bcmath php8.3-exif php8.3-ldap php8.3-mysql
# Database and packgages required by Moodle
sudo apt-get install -y unzip mariadb-server mariadb-client ufw nano graphviz aspell git clamav ghostscript composer certbot python3-certbot-nginx
```

### 1.2 Install a Webserver

Choose the Nginx option.

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Create the Nginx configuration file for Moodle. Copy and paste the entire block from `sudo` to `EOF`:

```bash
sudo tee /etc/nginx/sites-available/moodle.conf > /dev/null <<EOF
server {
    listen 80;
    server_name $WEBSITE_ADDRESS www.$WEBSITE_ADDRESS;
    root $MOODLE_CODE_FOLDER/public;
    index index.php index.html index.htm;

    location / {
        try_files \$uri \$uri/ /index.php?\$args /r.php;
    }

    location ~ [^/]\.php(/|$) {
        fastcgi_split_path_info ^(.+\.php)(/.+)\$;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_param PATH_INFO \$fastcgi_path_info;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF
```

Enable the config and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/moodle.conf /etc/nginx/sites-enabled/moodle.conf
sudo systemctl reload nginx
```

Make necessary changes to the PHP configuration required by Moodle:

```bash
sudo sed -i 's/^;max_input_vars =.*/max_input_vars = 5000/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^;max_input_vars =.*/max_input_vars = 5000/' /etc/php/8.3/cli/php.ini
sudo sed -i 's/^post_max_size =.*/post_max_size = 256M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^post_max_size =.*/post_max_size = 256M/' /etc/php/8.3/cli/php.ini
sudo sed -i 's/^upload_max_filesize =.*/upload_max_filesize = 256M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^upload_max_filesize =.*/upload_max_filesize = 256M/' /etc/php/8.3/cli/php.ini
sudo systemctl reload php8.3-fpm
```

### 1.3 Obtain Moodle code using git

git is a version control system that is the easiest way to download the latest Moodle code and unpack it into a directory. It also makes keeping up to date with patches much easier.

```bash
# Clone to the Moodle code folder
sudo git clone -b v5.1.0 https://github.com/moodle/moodle.git $MOODLE_CODE_FOLDER
sudo chown -R www-data:www-data $MOODLE_CODE_FOLDER
cd $MOODLE_CODE_FOLDER
CACHE_DIR="/var/www/.cache/composer"
sudo mkdir -p "$CACHE_DIR"
sudo chown -R www-data:www-data "$CACHE_DIR"
sudo chmod -R 750 "$CACHE_DIR"
sudo -u www-data COMPOSER_CACHE_DIR="$CACHE_DIR" composer install --no-dev --classmap-authoritative
sudo chown -R www-data:www-data vendor
sudo chmod -R 755 $MOODLE_CODE_FOLDER
```

### 1.3a Set up HTTPS

Certbot provisions a free Let's Encrypt SSL certificate and automatically configures Nginx for HTTPS. This must run after the Moodle code is cloned so the web root directory (`$MOODLE_CODE_FOLDER/public`) exists for Nginx.

> **AWS Lightsail:** Before running certbot, ensure ports **80** and **443** are open in your Lightsail instance's **Networking** tab. The domain must already have a DNS A record pointing to the instance's static IP.

```bash
sudo certbot --nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 1.4 Specific Moodle requirements

Moodle needs to store files in a specific directory accessible only by the web server. It also needs to change some php configuration settings and set up a cron task.

```bash
# Create the moodledata directory outside your web server's document root
sudo mkdir -p $MOODLE_DATA_FOLDER/moodledata
# Set the webserver as the owner and group recursively (for both the files and contents)
sudo chown -R www-data:www-data $MOODLE_DATA_FOLDER/moodledata
# Set the moodledata directory permissions so only the web server can read, write, and access them
sudo find $MOODLE_DATA_FOLDER/moodledata -type d -exec chmod 700 {} \;
# Set the moodledata file permissions so only the web server can read and write them
sudo find $MOODLE_DATA_FOLDER/moodledata -type f -exec chmod 600 {} \;
# Call cron.php in the moodle admin directory to run every minute
echo "* * * * * /usr/bin/php $MOODLE_CODE_FOLDER/admin/cli/cron.php >/dev/null" | sudo crontab -u www-data -
```

### 1.5 Create Database and User

Moodle needs a database and a user with full privileges.

Generate a random password for the database user:

```bash
MYSQL_MOODLEUSER_PASSWORD=$(openssl rand -base64 6)
echo "Moodle DB user password: $MYSQL_MOODLEUSER_PASSWORD"
```

Create the database and user:

```bash
sudo mysql -e "CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'moodleuser'@'localhost' IDENTIFIED BY '$MYSQL_MOODLEUSER_PASSWORD';"
sudo mysql -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, CREATE TEMPORARY TABLES, DROP, INDEX, ALTER ON moodle.* TO 'moodleuser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 1.6 Configure Moodle from the command line

The last step can be done using the browser but we have all the information needed to complete the installation.

Generate an admin password and temporarily open permissions for the installer:

```bash
MOODLE_ADMIN_PASSWORD=$(openssl rand -base64 8)
sudo chmod -R 0777 $MOODLE_CODE_FOLDER
```

Run the Moodle CLI installer:

```bash
cd $MOODLE_PATH
sudo -u www-data /usr/bin/php $MOODLE_CODE_FOLDER/admin/cli/install.php --non-interactive --lang=en --wwwroot="$PROTOCOL$WEBSITE_ADDRESS" --dataroot=$MOODLE_DATA_FOLDER/moodledata --dbtype=mariadb --dbhost=localhost --dbname=moodle --dbuser=moodleuser --dbpass="$MYSQL_MOODLEUSER_PASSWORD" --fullname="Generic Moodle" --shortname="GM" --adminuser=admin --summary="" --adminpass="$MOODLE_ADMIN_PASSWORD" --adminemail=please@changeme.com --agree-license
echo "Moodle installation completed successfully. You can now log on to your new Moodle at $PROTOCOL$WEBSITE_ADDRESS as admin with $MOODLE_ADMIN_PASSWORD and complete your site registration"
echo "Remember to change the admin email, name and shortname using the browser in your new Moodle"
```

Lock down file permissions and configure Nginx slash arguments:

```bash
sudo find $MOODLE_CODE_FOLDER -type d -exec chmod 755 {} \;
sudo find $MOODLE_CODE_FOLDER -type f -exec chmod 644 {} \;
sudo sed -i "/require_once(__DIR__ . '\/lib\/setup.php');/i \$CFG->slasharguments = false;" $MOODLE_CODE_FOLDER/config.php
```

## 2) Prepare Development Database for Production

A production database contains student submissions. Extra steps are needed to ensure student data is secure from unauthorized access and safeguard against data loss.

### 2.1 Check Permissions

Permissions are used by Linux to control read, write and execute for directories and folders.

```bash
# Reset permissions on moodle directories to read, write and execute for the webserver; read and execute for group and others
sudo find $MOODLE_CODE_FOLDER -type d -exec chmod 755 {} \;
# Reset permissions on moodle files to read, write for the webserver; read only for group and others
sudo find $MOODLE_CODE_FOLDER -type f -exec chmod 644 {} \;
```

### 2.2 Set a root password on the database

```bash
# Run the mariadb-secure-installation script to strengthen security by setting a root password, removing anonymous users, disabling remote root login, deleting the test database, and reloading privileges
# Don't forget to store the root database password in a safe place
sudo mariadb-secure-installation
```

### 2.3 Configure and enable a firewall

```bash
# Allow SSH (port 22) for remote access
sudo ufw allow 22/tcp
# Enable the UFW firewall with confirmation
sudo ufw --force enable
# Set default policy to deny all incoming connections
sudo ufw default deny incoming
# Set default policy to allow all outgoing connections
sudo ufw default allow outgoing
# Allow HTTP traffic on port 80
sudo ufw allow www
# Allow full access for Nginx (HTTP and HTTPS)
sudo ufw allow 'Nginx Full'
```

### 2.4 HTTPS certificate renewal

HTTPS was configured during installation (section 1.3a). Let's Encrypt certificates expire every 90 days. Certbot installs a systemd timer that handles automatic renewal. Verify it is active:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### 2.5 SSH keys

An SSH key consists of a public and private key pair used to securely authenticate using the Secure Shell (SSH) protocol without needing a password. The key is much longer and more complex than typical passwords, making them extremely resistant to brute-force attacks and guessing. Only the public key is copied (id_rsa.pub); never share your private key.

For Windows Users:

- Open Settings > Apps & Features > Optional Features. Look for "OpenSSH Client" in the list.
- If it's not installed, click "Add a feature," find "OpenSSH Client," and install it.

Linux Users:

- Open a terminal on your home machine (not your server).

```bash
# Generate the SSH key pair by running the key generation (without sudo so the keys are stored in ~/.ssh/)
ssh-keygen
# Press Enter to accept the default key save location (usually C:\Users\your_username\.ssh\id_rsa for Windows users, ~/.ssh\id_rsa for Linux)
# When prompted, optionally enter a secure passphrase for extra protection or press Enter to leave it empty.
# Copy your public key to the remote server's ~/.ssh/authorized_keys file, permissions will be sett automatically
ssh-copy-id user@server_address
# Try to log in, It should not ask you for a password.
```

### 2.6 Remove SSH root access

For security, you should always log in as a user with elevated privileges (a sudo user). You should never login as root on a production server and you should remove root SSH access from your server.

```bash
sudo adduser user1
```

Add user1 to the sudo group for administrative privileges:

```bash
sudo usermod -aG sudo user1
```

**Check you can ssh into your server as your new sudo user!** Leave another terminal open until confirmed.

```bash
# Backup sshd_config before modifying
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
# Open the ssh config file
sudo nano /etc/ssh/sshd_config
# Change the line containing PermitRootLogin to PermitRootLogin no
# Restart SSH service to apply changes
sudo systemctl restart ssh
```

### 2.7 Keep Ubuntu up to date

Applying security patches can be automated.

```bash
sudo apt install unattended-upgrades
# Edit or review /etc/apt/apt.conf.d/20auto-upgrades
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

These lines default to "1" for daily updates. Other values: "7" (weekly), "0" (disabled).

- `APT::Periodic::Update-Package-Lists "1";`
- `APT::Periodic::Unattended-Upgrade "1";`

```bash
# Edit config to customize what will be upgraded
# Uncomment as needed
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

- `Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";`
- `Unattended-Upgrade::Automatic-Reboot "true";`
- `Unattended-Upgrade::Automatic-Reboot-Time "02:00";`

Check the log at `/var/log/unattended-upgrades/`.

### 2.8 SQL Backups

Daily automated date marked sql backups should be set up on a production Moodle. Dumps can be large and need to be deleted periodically.

Generate a random password for the backup user:

```bash
BACKUP_USER_PASSWORD=$(openssl rand -base64 6)
echo "Backup user password: $BACKUP_USER_PASSWORD"
```

Create the backup database user with minimal privileges (better security than using root or moodleuser):

```bash
sudo mysql <<EOF
CREATE USER 'backupuser'@'localhost' IDENTIFIED BY '${BACKUP_USER_PASSWORD}';
GRANT LOCK TABLES, SELECT ON moodle.* TO 'backupuser'@'localhost';
FLUSH PRIVILEGES;
EOF
```

Create a credentials file so the password is not visible in the backup cron command:

```bash
sudo tee /root/.my.cnf > /dev/null <<EOF
[client]
user=backupuser
password=${BACKUP_USER_PASSWORD}
EOF
sudo chmod 600 /root/.my.cnf
```

Set up the backup directory:

```bash
sudo mkdir -p /var/backups/moodle
sudo chmod 700 /var/backups/moodle
sudo chown root:root /var/backups/moodle
```

Set up daily cron jobs: one to dump the database at 2am, another to delete dumps older than 7 days at 3am:

```bash
(sudo crontab -l 2>/dev/null; echo "0 2 * * * mysqldump --defaults-file=/root/.my.cnf moodle > /var/backups/moodle/moodle_backup_\$(date +\%F).sql") | sudo crontab -
(sudo crontab -l 2>/dev/null; echo "0 3 * * * find /var/backups/moodle -name \"moodle_backup_*.sql\" -type f -mtime +7 -delete") | sudo crontab -
```

### 2.9 Setting up antivirus on the server

In order to have your Moodle server scan uploaded files for viruses, you can set up Antivirus plugins.

ClamAV is available in Ubuntu:

```bash
# sudo apt install -y clamav
```

This installs the scanner for per-file uploads. To activate it, go to:

`Site administration > Plugins > Antivirus plugins > Manage antivirus plugins > ClamAV antivirus`

Enable the plugin, then set:

```bash
/usr/bin/clamscan
```

If you have many simultaneous uploads, consider the daemon mode:

```bash
# sudo apt install -y clamav-daemon
```

Then set:

```bash
/usr/bin/clamdscan
```

In previous Moodle branches:

- Check `Use ClamAV on uploaded files`
- `ClamAV Path`: `/usr/bin/clamscan`
- `Quarantine Directory`: `/var/quarantine`

Save changes.

## 3) Google OAuth2 Authentication

Enable "Log in with Google" so users can authenticate using their Google accounts.

### 3.1 Create Google OAuth2 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth client ID**.
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (or **Internal** if using Google Workspace and you only want org users).
   - Fill in the app name, user support email, and developer contact email.
   - Under **Scopes**, add `email`, `profile`, and `openid`.
   - Save and continue.
6. Back on **Create OAuth client ID**:
   - Application type: **Web application**.
   - Name: e.g. `Moodle OAuth`.
   - **Authorized redirect URIs**: Add `https://<your-moodle-domain>/admin/oauth2callback.php`
   - Click **Create**.
7. Copy the **Client ID** and **Client Secret**. You will need them in the next step.

### 3.2 Configure OAuth2 Service in Moodle

1. Log in to Moodle as an admin.
2. Go to **Site administration > Server > OAuth 2 services**.
3. Click the **Google** button under "Create new service" to use the built-in Google template.
4. Fill in the form:
   - **Name**: `Google`
   - **Client ID**: Paste the Client ID from step 3.1.
   - **Client secret**: Paste the Client Secret from step 3.1.
   - Leave the remaining fields at their defaults.
5. Click **Save changes**.
6. Verify the service shows a green checkmark indicating it is configured correctly.

### 3.3 Enable OAuth2 Login Plugin

1. Go to **Site administration > Plugins > Authentication > Manage authentication**.
2. Find **OAuth 2** in the list and click the **eye icon** to enable it.
3. Optionally, under the OAuth 2 settings on that page, check **Prevent account creation** if you only want existing Moodle users to log in with Google (no auto-registration).

### 3.4 Link OAuth2 Service to Login

1. Still on the **Manage authentication** page, click **Settings** next to **OAuth 2**.
2. Ensure the Google service you created is listed and enabled.
3. Save changes.

### 3.5 Disable Email Confirmation for OAuth2 Users

By default, Moodle requires email confirmation for new accounts created via OAuth2. Since Google already verifies email addresses, this is unnecessary and blocks users from logging in immediately.

#### Option A: Via the OAuth2 Service Configuration

1. Go to **Site administration > Server > OAuth 2 services**.
2. Click the **gear/edit icon** next to your Google service.
3. Uncheck **Require email verification** (if visible).
4. Save changes.

#### Option B: Via Database (if the UI option is not visible)

The `requireconfirmation` flag lives on the OAuth2 issuer record. Set it to `0` to skip email confirmation:

```bash
sudo mysql -e "UPDATE moodle.mdl_oauth2_issuer SET requireconfirmation = 0 WHERE name = 'Google';"
```

Purge Moodle's caches after the change:

```bash
sudo -u www-data /usr/bin/php $MOODLE_CODE_FOLDER/admin/cli/purge_caches.php
```

#### Fix Users Already Stuck in "Pending Email Confirmation"

If users have already signed in and are stuck with unconfirmed accounts, confirm them manually:

```bash
sudo mysql -e "UPDATE moodle.mdl_user SET confirmed = 1 WHERE confirmed = 0 AND auth = 'oauth2';"
```

### 3.6 Test Google Login

1. Open your Moodle site in a private/incognito browser window.
2. On the login page, you should see a **Log in with Google** button.
3. Click it and authenticate with a Google account.
4. Verify the user is logged in and their profile is created (or linked to an existing account).

### 3.7 Restrict to Specific Email Domain (Optional)

To limit Google login to a specific organization domain (e.g. `@limkokwing.ac.ls`):

1. Go to **Site administration > Plugins > Authentication > Manage authentication**.
2. Under **OAuth 2** settings, enter the allowed email domain(s) to restrict sign-ups.
3. Alternatively, on the Google Cloud Console under your OAuth consent screen, set the app to **Internal** (Google Workspace only) so only your organization members can authenticate.

## Sources

- MoodleDocs Ubuntu step-by-step: https://docs.moodle.org/en/Step-by-step_Installation_Guide_for_Ubuntu
- MoodleDocs OAuth 2 authentication: https://docs.moodle.org/en/OAuth_2_authentication
- MoodleDocs OAuth 2 Google service: https://docs.moodle.org/en/OAuth_2_Google_service
