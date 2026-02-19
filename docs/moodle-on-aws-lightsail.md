# Moodle on AWS Lightsail (Ubuntu 24 + PHP 8.3 + MariaDB)

This guide walks through provisioning an AWS Lightsail Ubuntu instance using the Lightsail console and installing Moodle using the MoodleDocs step-by-step Ubuntu guide (Apache or Nginx, PHP-FPM, MariaDB, CLI installer, cron, and HTTPS).

## Prerequisites

- AWS account with Lightsail access.
- AWS CLI installed and configured on your local machine (optional, only if you want to automate provisioning).
- A registered domain name (optional but recommended for HTTPS).
- Local SSH client.

## 1) Provision a Lightsail instance (UI)

Use the Lightsail console at https://lightsail.aws.amazon.com/ls/webapp/home/instances.

### 1.1 Create instance

1) Select Create instance.
2) Choose a region and availability zone close to your users.
3) Pick a blueprint: Ubuntu.
4) Choose a plan size that fits your load.
5) Name the instance and create it.

### 1.2 Configure networking

1) Open the instance.
2) Go to Networking.
3) Add or ensure inbound rules for:
   - SSH 22
   - HTTP 80
   - HTTPS 443

### 1.3 Allocate and attach a static IP

1) Open the Networking tab.
2) Create a static IP.
3) Attach it to your instance.

### 1.4 Find the public IP

The public IP is shown on the instance card and in the Networking tab.

### 1.5 SSH into the instance

Download your Lightsail default key pair from the Lightsail console, then connect:

```bash
ssh -i /path/to/LightsailDefaultKey.pem ubuntu@PUBLIC_IP
```

## 2) Update and install base packages

This guide assumes **Ubuntu 24** with `sudo` access.

```bash
PROTOCOL="http://";
read -p "Enter the web address (without the http:// prefix, eg domain name mymoodle123.com or IP address 192.168.1.1.): " WEBSITE_ADDRESS

MOODLE_PATH="/var/www/html/sites"
MOODLE_CODE_FOLDER="$MOODLE_PATH/moodle"
MOODLE_DATA_FOLDER="/var/www/data"

sudo mkdir -p "$MOODLE_PATH"
sudo mkdir -p "$MOODLE_DATA_FOLDER"
```

```bash
sudo apt-get update && sudo apt upgrade -y
sudo apt-get install -y php8.3-fpm php8.3-cli php8.3-curl php8.3-zip php8.3-gd php8.3-xml php8.3-intl php8.3-mbstring php8.3-xmlrpc php8.3-soap php8.3-bcmath php8.3-exif php8.3-ldap php8.3-mysql
sudo apt-get install -y unzip mariadb-server mariadb-client ufw nano graphviz aspell git clamav ghostscript composer
```

## 3) Install a webserver (choose one)

Apache and Nginx are both valid options. **Install one or the other, not both.**

### Option A: Apache

```bash
sudo apt-get install -y apache2 libapache2-mod-fcgid
sudo a2enmod proxy_fcgi setenvif rewrite

sudo tee /etc/apache2/sites-available/moodle.conf > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $WEBSITE_ADDRESS
    ServerAlias www.$WEBSITE_ADDRESS

    DocumentRoot  $MOODLE_CODE_FOLDER/public

    <Directory $MOODLE_PATH>
        Options FollowSymLinks
        AllowOverride None
        Require all granted
        DirectoryIndex index.php index.html
        FallbackResource /r.php
    </Directory>

    <FilesMatch "\\.php$">
        SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost/"
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

sudo a2ensite moodle.conf
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
sudo systemctl enable --now php8.3-fpm

php_ini_fpm="/etc/php/8.3/fpm/php.ini"
php_ini_cli="/etc/php/8.3/cli/php.ini"

sudo sed -i 's/^[[:space:]]*;*[[:space:]]*max_input_vars[[:space:]]*=.*/max_input_vars = 5000/' "$php_ini_fpm"
sudo sed -i 's/^[[:space:]]*;*[[:space:]]*max_input_vars[[:space:]]*=.*/max_input_vars = 5000/' "$php_ini_cli"
sudo sed -i 's/^\s*post_max_size\s*=.*/post_max_size = 256M/' "$php_ini_fpm"
sudo sed -i 's/^\s*post_max_size\s*=.*/post_max_size = 256M/' "$php_ini_cli"
sudo sed -i 's/^\s*upload_max_filesize\s*=.*/upload_max_filesize = 256M/' "$php_ini_fpm"
sudo sed -i 's/^\s*upload_max_filesize\s*=.*/upload_max_filesize = 256M/' "$php_ini_cli"

sudo systemctl reload php8.3-fpm
```

### Option B: Nginx

```bash
sudo apt-get install -y nginx

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

sudo ln -s /etc/nginx/sites-available/moodle.conf /etc/nginx/sites-enabled/moodle.conf
sudo systemctl reload nginx

sudo sed -i 's/^;max_input_vars =.*/max_input_vars = 5000/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^;max_input_vars =.*/max_input_vars = 5000/' /etc/php/8.3/cli/php.ini
sudo sed -i 's/^post_max_size =.*/post_max_size = 256M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^post_max_size =.*/post_max_size = 256M/' /etc/php/8.3/cli/php.ini
sudo sed -i 's/^upload_max_filesize =.*/upload_max_filesize = 256M/' /etc/php/8.3/fpm/php.ini
sudo sed -i 's/^upload_max_filesize =.*/upload_max_filesize = 256M/' /etc/php/8.3/cli/php.ini
sudo systemctl reload php8.3-fpm
```

## 4) Obtain Moodle code using git

```bash
sudo git clone -b v5.1.0 https://github.com/moodle/moodle.git "$MOODLE_CODE_FOLDER"
sudo chown -R www-data:www-data "$MOODLE_CODE_FOLDER"

cd "$MOODLE_CODE_FOLDER"
CACHE_DIR="/var/www/.cache/composer"
sudo mkdir -p "$CACHE_DIR"
sudo chown -R www-data:www-data "$CACHE_DIR"
sudo chmod -R 750 "$CACHE_DIR"
sudo -u www-data COMPOSER_CACHE_DIR="$CACHE_DIR" composer install --no-dev --classmap-authoritative

sudo chown -R www-data:www-data vendor
sudo chmod -R 755 "$MOODLE_CODE_FOLDER"
```

## 5) Specific Moodle requirements

```bash
sudo mkdir -p "$MOODLE_DATA_FOLDER"/moodledata
sudo chown -R www-data:www-data "$MOODLE_DATA_FOLDER"/moodledata
sudo find "$MOODLE_DATA_FOLDER"/moodledata -type d -exec chmod 700 {} \;
sudo find "$MOODLE_DATA_FOLDER"/moodledata -type f -exec chmod 600 {} \;

echo "* * * * * /usr/bin/php $MOODLE_CODE_FOLDER/admin/cli/cron.php >/dev/null" | sudo crontab -u www-data -
```

## 6) Create database and user

```bash
MYSQL_MOODLEUSER_PASSWORD=$(openssl rand -base64 6)
sudo mysql -e "CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'moodleuser'@'localhost' IDENTIFIED BY '$MYSQL_MOODLEUSER_PASSWORD';"
sudo mysql -e "GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, CREATE TEMPORARY TABLES, DROP, INDEX, ALTER ON moodle.* TO 'moodleuser'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## 7) Configure Moodle from the command line

```bash
MOODLE_ADMIN_PASSWORD=$(openssl rand -base64 8)
sudo chmod -R 0777 "$MOODLE_CODE_FOLDER"

cd "$MOODLE_PATH"
sudo -u www-data /usr/bin/php "$MOODLE_CODE_FOLDER"/admin/cli/install.php --non-interactive --lang=en --wwwroot="$PROTOCOL$WEBSITE_ADDRESS" --dataroot="$MOODLE_DATA_FOLDER"/moodledata --dbtype=mariadb --dbhost=localhost --dbname=moodle --dbuser=moodleuser --dbpass="$MYSQL_MOODLEUSER_PASSWORD" --fullname="Generic Moodle" --shortname="GM" --adminuser=admin --summary="" --adminpass="$MOODLE_ADMIN_PASSWORD" --adminemail=please@changeme.com --agree-license

echo "Moodle installation completed successfully. You can now log on to your new Moodle at $PROTOCOL$WEBSITE_ADDRESS as admin with $MOODLE_ADMIN_PASSWORD and complete your site registration"
echo "Remember to change the admin email, name and shortname using the browser in your new Moodle"

sudo find "$MOODLE_CODE_FOLDER" -type d -exec chmod 755 {} \;
sudo find "$MOODLE_CODE_FOLDER" -type f -exec chmod 644 {} \;
```

If you installed Nginx:

```bash
sudo sed -i "/require_once(__DIR__ . '\\/lib\\/setup.php');/i \$CFG->slasharguments = false;" "$MOODLE_CODE_FOLDER"/config.php
```

## 8) Prepare for production

### 8.1 Check permissions

```bash
sudo find "$MOODLE_CODE_FOLDER" -type d -exec chmod 755 {} \;
sudo find "$MOODLE_CODE_FOLDER" -type f -exec chmod 644 {} \;
```

### 8.2 Set a root password on the database

```bash
sudo mariadb-secure-installation
```

### 8.3 Configure and enable a firewall

```bash
sudo ufw allow 22/tcp
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow www
```

If you installed Apache:

```bash
sudo ufw allow 'Apache Full'
```

If you installed Nginx:

```bash
sudo ufw allow 'Nginx Full'
```

### 8.4 Convert http to https

#### Apache

```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache
sudo apache2ctl configtest
sudo systemctl reload apache2
```

#### Nginx

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx
sudo nginx -t
sudo systemctl reload nginx
```

After switching to HTTPS, update references:

```bash
cd "$MOODLE_CODE_FOLDER"
sudo php admin/tool/replace/cli/replace.php --search=//oldsitehost --replace=//newsitehost --shorten --non-interactive
```

### 8.5 SSH keys

On your local machine:

```bash
ssh-keygen
ssh-copy-id user@server_address
```

### 8.6 Remove SSH root access

```bash
adduser user1
usermod -aG sudo user1

sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo nano /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### 8.7 Keep Ubuntu up to date

```bash
sudo apt install unattended-upgrades
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

### 8.8 SQL backups

```bash
BACKUP_USER_PASSWORD=$(openssl rand -base64 6)
mysql <<EOF
CREATE USER 'backupuser'@'localhost' IDENTIFIED BY '${BACKUP_USER_PASSWORD}';
GRANT LOCK TABLES, SELECT ON moodle.* TO 'backupuser'@'localhost';
FLUSH PRIVILEGES;
EOF

cat > /root/.my.cnf <<EOF
[client]
user=backupuser
password=${BACKUP_USER_PASSWORD}
EOF

chmod 600 /root/.my.cnf
mkdir -p /var/backups/moodle && chmod 700 /var/backups/moodle && chown root:root /var/backups/moodle

(crontab -l 2>/dev/null; echo "0 2 * * * mysqldump --defaults-file=/root/.my.cnf moodle > /var/backups/moodle/moodle_backup_\$(date +\%F).sql") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * find /var/backups/moodle -name \"moodle_backup_*.sql\" -type f -mtime +7 -delete") | crontab -
```

### 8.9 Antivirus

ClamAV is available on Ubuntu. Install and configure a Moodle antivirus plugin as needed.

## Sources

- Lightsail console: https://lightsail.aws.amazon.com/ls/webapp/home/instances
- MoodleDocs Ubuntu step-by-step: https://docs.moodle.org/en/Step-by-step_Installation_Guide_for_Ubuntu
