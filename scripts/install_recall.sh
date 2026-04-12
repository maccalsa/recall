#!/usr/bin/env bash
# Linux: install Recall from GitHub releases (AppImage or .deb).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=install_recall.env
source "${SCRIPT_DIR}/install_recall.env"

VERSION="${RECALL_VERSION}"
APP_NAME="${RECALL_APP_NAME}"
APP_ID="${RECALL_APP_ID}"
GITHUB_REPO="${RECALL_GITHUB_REPO}"
DEB_PACKAGE="${RECALL_DEB_PACKAGE}"

APPIMAGE_NAME="${APP_NAME}_${VERSION}_amd64.AppImage"
DEB_NAME="${APP_NAME}_${VERSION}_amd64.deb"

BASE_URL="https://github.com/${GITHUB_REPO}/releases/download/v${VERSION}"
APPIMAGE_URL="${BASE_URL}/${APPIMAGE_NAME}"
DEB_URL="${BASE_URL}/${DEB_NAME}"

BIN_DIR="${HOME}/.local/bin"
APP_DIR="${HOME}/.local/share/${APP_ID}"
DESKTOP_DIR="${HOME}/.local/share/applications"
AUTOSTART_DIR="${HOME}/.config/autostart"
APPIMAGE_PATH="${APP_DIR}/${APPIMAGE_NAME}"
DESKTOP_FILE="${DESKTOP_DIR}/${APP_ID}.desktop"
AUTOSTART_FILE="${AUTOSTART_DIR}/${APP_ID}.desktop"

ACTION=""
METHOD=""
ENABLE_AUTOSTART="false"

parse_cli() {
  local a1="${1:-install}"
  local a2="${2:-}"
  local a3="${3:-}"

  ACTION="${a1}"

  case "${ACTION}" in
    install | upgrade)
      if [[ -z "${a2}" ]]; then
        METHOD="appimage"
        ENABLE_AUTOSTART="false"
      elif [[ "${a2}" == "appimage" || "${a2}" == "deb" ]]; then
        METHOD="${a2}"
        if [[ -n "${a3}" ]]; then
          if [[ "${a3}" != "true" && "${a3}" != "false" ]]; then
            echo "Autostart must be true or false (got: ${a3})" >&2
            usage
            exit 1
          fi
          ENABLE_AUTOSTART="${a3}"
        else
          ENABLE_AUTOSTART="false"
        fi
      else
        echo "Expected appimage or deb after ${ACTION} (got: ${a2})" >&2
        usage
        exit 1
      fi
      ;;
    uninstall | help | -h | --help)
      if [[ -n "${a2}" ]]; then
        echo "Unexpected argument after ${ACTION}: ${a2}" >&2
        usage
        exit 1
      fi
      ;;
    *)
      usage
      exit 1
      ;;
  esac

  if [[ "${ACTION}" == "install" || "${ACTION}" == "upgrade" ]] && [[ -n "${4:-}" ]]; then
    echo "Unexpected argument: ${4}" >&2
    usage
    exit 1
  fi
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

download_file() {
  local url="$1"
  local out="$2"
  echo "Downloading: ${url}"
  curl -L --fail --output "${out}" "${url}"
}

ensure_install_dirs() {
  mkdir -p "${BIN_DIR}" "${APP_DIR}" "${DESKTOP_DIR}" "${AUTOSTART_DIR}"
}

install_fuse_if_needed() {
  if [[ -f /etc/os-release ]]; then
    # shellcheck source=/dev/null
    . /etc/os-release || true
    if command -v apt >/dev/null 2>&1; then
      if ! dpkg -s libfuse2 >/dev/null 2>&1; then
        echo "libfuse2 not found. Installing it for AppImage support..."
        sudo apt update
        sudo apt install -y libfuse2 || {
          echo "Could not install libfuse2 automatically."
          echo "You may need to install it manually."
        }
      fi
    fi
  fi
}

write_desktop_file() {
  local target_exec="$1"

  cat > "${DESKTOP_FILE}" <<EOF
[Desktop Entry]
Name=${APP_NAME}
Comment=Recall
Exec=${target_exec}
Terminal=false
Type=Application
Categories=Utility;Office;Productivity;
StartupNotify=true
EOF

  chmod +x "${DESKTOP_FILE}"
  echo "Desktop entry written to ${DESKTOP_FILE}"
}

enable_autostart() {
  cp "${DESKTOP_FILE}" "${AUTOSTART_FILE}"
  chmod +x "${AUTOSTART_FILE}"
  echo "Autostart enabled: ${AUTOSTART_FILE}"
}

install_appimage() {
  need_cmd curl
  ensure_install_dirs
  install_fuse_if_needed

  download_file "${APPIMAGE_URL}" "${APPIMAGE_PATH}"
  chmod +x "${APPIMAGE_PATH}"

  ln -sf "${APPIMAGE_PATH}" "${BIN_DIR}/${APP_ID}"

  write_desktop_file "${APPIMAGE_PATH}"

  if [[ "${ENABLE_AUTOSTART}" == "true" ]]; then
    enable_autostart
  fi

  echo
  echo "Installed ${APP_NAME} AppImage"
  echo "Run with: ${BIN_DIR}/${APP_ID}"
}

install_deb() {
  need_cmd curl
  need_cmd sudo
  ensure_install_dirs

  local tmp_deb
  tmp_deb="$(mktemp --suffix=.deb)"
  trap 'rm -f "${tmp_deb}"' EXIT

  download_file "${DEB_URL}" "${tmp_deb}"
  sudo apt install -y "${tmp_deb}"

  if command -v recall >/dev/null 2>&1; then
    write_desktop_file "$(command -v recall)"
  else
    echo "Installed .deb, but 'recall' was not found on PATH."
    echo "You may still be able to launch it from your app menu."
  fi

  if [[ "${ENABLE_AUTOSTART}" == "true" ]]; then
    enable_autostart
  fi

  echo
  echo "Installed ${APP_NAME} .deb package"
}

uninstall_linux() {
  rm -f "${BIN_DIR}/${APP_ID}"
  rm -rf "${APP_DIR}"
  rm -f "${DESKTOP_FILE}" "${AUTOSTART_FILE}"

  if command -v apt >/dev/null 2>&1; then
    if dpkg -s "${DEB_PACKAGE}" >/dev/null 2>&1; then
      need_cmd sudo
      echo "Removing apt package ${DEB_PACKAGE}..."
      sudo apt remove -y "${DEB_PACKAGE}" || true
    fi
  fi

  echo "Removed user install artifacts for ${APP_NAME}."
}

usage() {
  cat <<EOF
Usage: $0 [install|uninstall|upgrade] [appimage|deb] [true|false]

  install | upgrade   Download and install. With no method, uses appimage and no autostart.
  uninstall           Remove ~/.local layout, desktop/autostart, and apt package ${DEB_PACKAGE} if present.

  For install|upgrade, optional arguments:
    appimage | deb     Package type (default: appimage when omitted).
    true | false       XDG autostart (~/.config/autostart); default false.

Environment:
  ${SCRIPT_DIR}/install_recall.env (RECALL_VERSION, RECALL_DEB_PACKAGE, …)

Examples:
  $0
  $0 install appimage true
  $0 upgrade deb
  $0 uninstall
EOF
}

parse_cli "$@"

case "${ACTION}" in
  install)
    case "${METHOD}" in
      appimage) install_appimage ;;
      deb) install_deb ;;
      *)
        usage
        exit 1
        ;;
    esac
    ;;
  upgrade)
    case "${METHOD}" in
      appimage) install_appimage ;;
      deb) install_deb ;;
      *)
        usage
        exit 1
        ;;
    esac
    ;;
  uninstall)
    uninstall_linux
    ;;
  help | -h | --help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
