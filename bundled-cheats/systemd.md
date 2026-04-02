---
title: systemd
tags: [systemd, systemctl, journalctl, linux, service]
---

## Service Management

```bash
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx      # reload config if supported
sudo systemctl try-restart nginx
sudo systemctl kill -s HUP nginx
```

## Status & Info

```bash
systemctl status nginx
systemctl is-active nginx
systemctl is-enabled nginx
systemctl show nginx
systemctl cat nginx
systemctl list-units --type=service --state=running
systemctl list-unit-files | grep nginx
```

## Enable/Disable

```bash
sudo systemctl enable nginx
sudo systemctl enable --now nginx   # enable + start
sudo systemctl disable nginx
sudo systemctl mask nginx           # prevent start (symlink to /dev/null)
sudo systemctl unmask nginx
```

## Logs (journalctl)

```bash
journalctl -u nginx
journalctl -u nginx -f              # follow
journalctl -u nginx --since today
journalctl -u nginx --since "2024-01-01 00:00:00" --until "2024-01-02"
journalctl -p err
journalctl -b                       # current boot
journalctl -k                       # kernel
journalctl --disk-usage
sudo journalctl --vacuum-time=7d
```

## Timers

```bash
systemctl list-timers
sudo systemctl enable --now backup.timer
sudo systemctl start backup.timer
journalctl -u backup.service
```

## Unit Files

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My App
After=network-online.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/bin/myapp
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart myapp
```

## Targets

```bash
systemctl get-default
sudo systemctl set-default multi-user.target
sudo systemctl isolate rescue.target
systemctl list-dependencies graphical.target
```
