# Inventory Management System

This Python script provides a robust and customizable solution for managing inventory and user authentication. It is designed to offer flexibility, security, and ease of use in various inventory management scenarios.

**Note**: By default, the username is 'user', and the password is '1234' when program is executed for the first time.

## Table of Contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Installation](#installation)
- [Usage](#usage)
- [User Management](#user-management)
- [Inventory Management](#inventory-management)
- [Logging](#logging)
- [Error Handling](#error-handling)

## Features

1. **User Authentication**:
   - Secure authentication system requiring a valid username and password.
   - Supports multiple user roles: admin, editor, and viewer.
   - Default user ('user') with password '1234' provided for initial access.

2. **User Management**:
   - Administrators can add, delete, and modify user accounts.
   - Each user account is associated with a role, determining their level of access within the system.
   - Admins have full control over user management, including role assignments.

3. **Inventory Management**:
   - Add new items to the inventory with ease, specifying quantity and optional custom fields for detailed descriptions.
   - Remove items from the inventory, updating quantities and group associations as needed.
   - Group similar items together for organizational purposes, simplifying management and reporting.
   - Search for specific items by name or partial name, facilitating quick inventory lookups.

4. **Reports and Data Export**:
   - Generate detailed reports in CSV format, providing comprehensive insights into item details and inventory summaries.
   - Export inventory data to a JSON file for backup, external analysis, or integration with other systems.

5. **Logging**:
   - Comprehensive logging system records all actions performed within the inventory management system.
   - Log entries include timestamps, log levels, and detailed descriptions of the actions taken.
   - Logs are stored in a designated file ('inventory.log') for easy auditing and troubleshooting.

6. **Error Handling**:
   - Robust error handling mechanisms prevent unexpected crashes and ensure smooth operation.
   - Errors are logged for debugging purposes, aiding in rapid identification and resolution of issues.

## Dependencies

This script requires Python 3.x. It utilizes built-in modules such as `json`, `logging`, `csv`, and `hashlib`, eliminating the need for external dependencies.

## Installation

1. Clone the repository or download the script to your local machine.
2. Ensure you have Python 3.x installed on your system.
3. No additional installation steps are required. Simply run the script using `python inventory_management.py`.

## Usage

1. Upon running the script, users are prompted to authenticate with a valid username and password.
2. Once authenticated, users can access various features based on their assigned roles.
3. The main menu presents a range of options, including user management, inventory management, report generation, and more.

## User Management

- **Add User**: Administrators can add new users, specifying their roles (admin, editor, viewer).
- **Delete User**: Administrators can delete existing users, with the exception of the default user ('user').
- **Change Role**: Administrators can modify the roles of users, adjusting their level of access within the system.
- **List Users**: Administrators can list all existing users along with their assigned roles for easy reference.

## Inventory Management

- **Add Item**: Add new items to the inventory, specifying quantity and optional custom fields for detailed descriptions.
- **Remove Item**: Remove items from the inventory, updating quantities and group associations as needed.
- **Check Inventory**: View inventory items, either grouped by specified categories or as a comprehensive list.
- **Generate Report**: Generate detailed reports in CSV format, providing insights into item details and inventory summaries.
- **View Item History**: View historical actions performed on specific items for auditing purposes.
- **Search Item**: Search for items by name or partial name to quickly locate inventory items.
- **Export Data**: Export inventory data to a JSON file for backup, external analysis, or integration with other systems.

## Logging

- Logs are stored in the `inventory.log` file, providing a detailed record of all actions performed within the system.
- Each log entry includes a timestamp, log level, and a description of the action taken.

## Error Handling

- The script employs comprehensive error handling mechanisms to ensure smooth operation and prevent unexpected crashes.
- Errors are logged for debugging purposes, facilitating rapid identification and resolution of issues.
