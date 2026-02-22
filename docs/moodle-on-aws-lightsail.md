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

```bash
sudo apt-get install -y nginx

# Set up the configuration file including the fallback required for the router
# Using tee allows the file to be written in a single (rather long command). This could also have been done with a text editor.
# Be sure to copy and paste entire block from "sudo" to "EOF"
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

# Recognise the new config file
sudo ln -s /etc/nginx/sites-available/moodle.conf /etc/nginx/sites-enabled/moodle.conf
sudo systemctl reload nginx

# Make necessary changes to the php configuration required by Moodle
# Using sed finds and replaces text. This could have been done in a text editor
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

```bash
# Create a random password for the user who will access the moodle database
MYSQL_MOODLEUSER_PASSWORD=$(openssl rand -base64 6)
# Create a new database named moodle with the utf8mb4 character set and utf8mb4_unicode_ci collation
sudo mysql -e "CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
# Create a new MySQL user moodleuser with a password
sudo mysql -e "CREATE USER 'moodleuser'@'localhost' IDENTIFIED BY '$MYSQL_MOODLEUSER_PASSWORD';"
# Grant privileges on the moodle database to the moodleuser to allow localhost access
sudo mysql -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, CREATE TEMPORARY TABLES, DROP, INDEX, ALTER ON moodle.* TO 'moodleuser'@'localhost';"
# Reload privilege tables
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 1.6 Configure Moodle from the command line

The last step can be done using the browser but we have all the information needed to complete the installation.

```bash
MOODLE_ADMIN_PASSWORD=$(openssl rand -base64 8)
sudo chmod -R 0777 $MOODLE_CODE_FOLDER
cd $MOODLE_PATH
sudo -u www-data /usr/bin/php $MOODLE_CODE_FOLDER/admin/cli/install.php --non-interactive --lang=en --wwwroot="$PROTOCOL$WEBSITE_ADDRESS" --dataroot=$MOODLE_DATA_FOLDER/moodledata --dbtype=mariadb --dbhost=localhost --dbname=moodle --dbuser=moodleuser --dbpass="$MYSQL_MOODLEUSER_PASSWORD" --fullname="Generic Moodle" --shortname="GM" --adminuser=admin --summary="" --adminpass="$MOODLE_ADMIN_PASSWORD" --adminemail=please@changeme.com --agree-license
echo "Moodle installation completed successfully. You can now log on to your new Moodle at $PROTOCOL$WEBSITE_ADDRESS as admin with $MOODLE_ADMIN_PASSWORD and complete your site registration"
echo "Remember to change the admin email, name and shortname using the browser in your new Moodle"
sudo find $MOODLE_CODE_FOLDER -type d -exec chmod 755 {} \;
sudo find $MOODLE_CODE_FOLDER -type f -exec chmod 644 {} \;

# Nginx needs slash arguments set
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
# If you don't already have a sudo user, as root, create a new user 'user1' with home directory and prompt for password
adduser user1
# Enter and confirm a password for user1. User details are optional
# Add user1 to the sudo group for administrative privileges
usermod -aG sudo user1
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

```bash
# Create MySQL backup user and grant privileges to lock tables (better security than using root or moodleuser roles)
BACKUP_USER_PASSWORD=$(openssl rand -base64 6)
mysql <<EOF
CREATE USER 'backupuser'@'localhost' IDENTIFIED BY '${BACKUP_USER_PASSWORD}';
GRANT LOCK TABLES, SELECT ON moodle.* TO 'backupuser'@'localhost';
FLUSH PRIVILEGES;
EOF
# Create a configuration file for root with the backup user credentials (to avoid the password being visible in the SQL backup call)
cat > /root/.my.cnf <<EOF
[client]
user=backupuser
password=${BACKUP_USER_PASSWORD}
EOF
# Set the configuration file permissions to read and write for root only
chmod 600 /root/.my.cnf
# Setup backup directory with read, write and execute permissions for root only
mkdir -p /var/backups/moodle && chmod 700 /var/backups/moodle && chown root:root /var/backups/moodle
# Set up two daily cron jobs, one to dump the database and the other to remove dumps more than a set number of days old (hardcoded to 7)
(crontab -l 2>/dev/null; echo "0 2 * * * mysqldump --defaults-file=/root/.my.cnf moodle > /var/backups/moodle/moodle_backup_\$(date +\%F).sql") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * find /var/backups/moodle -name \"moodle_backup_*.sql\" -type f -mtime +7 -delete") | crontab -
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

## Sources

- MoodleDocs Ubuntu step-by-step: https://docs.moodle.org/en/Step-by-step_Installation_Guide_for_Ubuntu
