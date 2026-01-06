#!/bin/sh

# Get the directory of the script
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ENV_FILE="$SCRIPT_DIR/../.env"

# Load environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
    . "$ENV_FILE"
fi

echo "Starting Dashticz components synchronization..."
echo "Using source path: ${DASHTICZ_COMPONENTS_SOURCE_PATH}"
echo "Using target path: ${DASHTICZ_COMPONENTS_PATH}"

# Default paths if not set
DASHTICZ_COMPONENTS_SOURCE_PATH=${DASHTICZ_COMPONENTS_SOURCE_PATH:-/home/pi/dashticz-components/js/components/}
DASHTICZ_COMPONENTS_PATH=${DASHTICZ_COMPONENTS_PATH:-/opt/stacks/dashticz/dashticz/js/components/}

# Sync components using rsync
rsync -auvh --chown=${WWW_USER_ID}:${WWW_GROUP_ID} "$DASHTICZ_COMPONENTS_SOURCE_PATH" "$DASHTICZ_COMPONENTS_PATH"
echo "Dashticz components synchronized to $DASHTICZ_COMPONENTS_PATH"
echo "User ID: ${WWW_USER_ID}, Group ID: ${WWW_GROUP_ID}"
exit 0