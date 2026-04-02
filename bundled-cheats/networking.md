---
title: Linux Networking
tags: [networking, linux, ip, dns, firewall]
---

## IP & Interfaces

```bash
ip addr
ip link
ip route
ip -4 addr show dev eth0
sudo ip addr add 192.168.1.10/24 dev eth0
sudo ip link set eth0 up
```

Legacy (still common):

```bash
ifconfig
route -n
```

## DNS

```bash
cat /etc/resolv.conf
getent hosts example.com
dig example.com
dig @8.8.8.8 example.com A
nslookup example.com
host example.com
```

## Ports & Connections

```bash
ss -tulpn
ss -tlnp | grep :443
sudo lsof -i :8080
netstat -tulpn        # if available
```

## Firewall (iptables/nftables/ufw)

**ufw** (simple front-end):

```bash
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow from 10.0.0.0/8 to any port 5432
sudo ufw enable
```

**nftables** (modern):

```bash
sudo nft list ruleset
```

**iptables** (legacy):

```bash
sudo iptables -L -n -v
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## wget & curl

```bash
wget -O out.zip https://example.com/file.zip
wget -c https://example.com/big.iso          # resume

curl -O https://example.com/file.txt
curl -fsSL https://example.com/install.sh | bash
curl -H "Authorization: Bearer TOKEN" https://api.example.com/v1/me
curl -X POST -d '{"k":"v"}' -H "Content-Type: application/json" URL
```

## Network Troubleshooting

```bash
ping -c 4 8.8.8.8
traceroute example.com
mtr example.com           # if installed
nc -vz host 443           # port open?
dig +trace example.com
tcpdump -i eth0 port 80   # requires privileges
```
