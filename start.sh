#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Define the ports used by Firebase emulators
# Required ports that must be free
REQUIRED_PORT_NAMES=(
    "4000:Emulator Hub"
    "5001:Functions"
    "8080:Firestore"
    "8085:Cloud Pub/Sub"
    "9099:Authentication"
    "9199:Storage"
)

# Optional ports that we'll check but won't block startup
OPTIONAL_PORT_NAMES=(
    "5000:Firebase Hosting"
)

echo -e "${YELLOW}Checking Firebase Emulator ports...${NC}"

# Function to check and kill process on a port
check_and_kill_port() {
    local port=$1
    local port_name=$2

    # Check if port is in use
    local pid=$(lsof -ti :$port 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo -e "${RED}Port $port ($port_name) is in use by process $pid${NC}"

        # Get process info
        local process_info=$(ps -p $pid -o comm= 2>/dev/null || echo "Unknown")
        echo -e "  Process: ${process_info}"

        # Kill the process
        echo -e "  ${YELLOW}Killing process $pid...${NC}"
        kill -9 $pid 2>/dev/null

        # Wait a moment for the port to be released
        sleep 1

        # Verify the port is free
        if lsof -ti :$port >/dev/null 2>&1; then
            echo -e "  ${RED}Failed to free port $port${NC}"
            return 1
        else
            echo -e "  ${GREEN}Port $port is now free${NC}"
        fi
    else
        echo -e "${GREEN}Port $port ($port_name) is available${NC}"
    fi

    return 0
}

# Check required ports
all_required_ports_free=true
echo -e "\n${YELLOW}Checking required ports:${NC}"
for port_info in "${REQUIRED_PORT_NAMES[@]}"; do
    IFS=':' read -r port name <<< "$port_info"
    if ! check_and_kill_port $port "$name"; then
        all_required_ports_free=false
    fi
done

# Check optional ports (don't fail if these can't be freed)
echo -e "\n${YELLOW}Checking optional ports:${NC}"
for port_info in "${OPTIONAL_PORT_NAMES[@]}"; do
    IFS=':' read -r port name <<< "$port_info"
    if ! check_and_kill_port $port "$name"; then
        echo -e "${YELLOW}  Note: Port $port is in use. Firebase Hosting will use an alternate port.${NC}"
    fi
done

echo ""

# Exit if we couldn't free all required ports
if [ "$all_required_ports_free" = false ]; then
    echo -e "${RED}ERROR: Could not free all required ports. Please check for persistent processes.${NC}"
    echo -e "${YELLOW}You may need to run this script with sudo if processes are owned by other users.${NC}"
    exit 1
fi

echo -e "${GREEN}All ports are available. Starting Firebase emulators...${NC}"
echo ""

# Start Firebase emulators with import/export
echo -e "${YELLOW}Starting Firebase emulators...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop emulators and export data.${NC}"
echo -e "${YELLOW}Logs displayed here and saved to emulator-debug.log${NC}"
echo ""

# Use script command to log output while preserving TTY and signal handling
script -q emulator-debug.log firebase emulators:start --export-on-exit=.emulator-data --import=.emulator-data
