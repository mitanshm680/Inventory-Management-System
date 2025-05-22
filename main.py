# main.py

import logging
import os

from utils.logging_config import setup_logging
from services.user_service import UserService
from services.inventory_service import InventoryService
from database.setup import initialize_database
from utils.export import generate_report
from services.report_service import ReportService


def main():
    """Main entry point for the command-line interface."""
    # Setup logging
    setup_logging()
    
    # Initialize the database
    initialize_database()
    
    # Initialize services
    user_service = UserService()
    inventory_service = InventoryService()
    report_service = ReportService()
    
    # Authenticate user
    role = None
    while role is None:
        username = input("Enter username: ")
        password = input("Enter password: ")
        role = user_service.authenticate(username, password)
        if role is None:
            print("Authentication failed. Please try again.")
    
    print(f"Welcome, {username}! You are logged in as: {role}")
    
    # Main program loop with permission checks
    while True:
        print("\nInventory Management System")
        print("---------------------------")
        print("1. Add item")
        print("2. Remove item")
        print("3. Check inventory")
        print("4. Check group")
        print("5. Search item")
        print("6. Export data")
        print("7. Generate report")
        print("8. View item history")
        print("9. Backup data")
        print("10. Delete item")
        print("11. Rename group")
        print("12. Manage users")
        print("13. Exit")
        
        try:
            choice = int(input("\nEnter your choice: "))
            
            if choice == 1 and role in ('admin', 'editor'):
                item_name = input("Enter item name: ")
                quantity = int(input("Enter quantity: "))
                group_choice = input("Enter group (or leave blank for no group): ")
                group = group_choice if group_choice else None
                
                custom_fields = {}
                while True:
                    field_name = input("Enter custom field name (or leave blank to stop): ")
                    if not field_name:
                        break
                    field_value = input(f"Enter value for {field_name}: ")
                    custom_fields[field_name] = field_value
                
                inventory_service.add_item(item_name, quantity, group, custom_fields)
                print(f"Added {quantity} of {item_name} to inventory.")
                
            elif choice == 2 and role in ('admin', 'editor'):
                item_name = input("Enter item name: ")
                quantity = int(input("Enter quantity to remove: "))
                if inventory_service.remove_item(item_name, quantity):
                    print(f"Removed {quantity} of {item_name} from inventory.")
                else:
                    print("Failed to remove item.")
                    
            elif choice == 3:
                groups_input = input("Enter group(s) to check (comma separated) or leave blank for entire inventory: ")
                groups = [group.strip() for group in groups_input.split(',')] if groups_input else None
                
                items = inventory_service.get_inventory(groups)
                if items:
                    print("\nInventory:")
                    for item in items:
                        print(item)
                else:
                    print("No items found in inventory.")
                    
            elif choice == 4:
                group = input("Enter group: ")
                items = inventory_service.get_inventory([group])
                
                if items:
                    print(f"\nItems in group '{group}':")
                    for item in items:
                        print(item)
                else:
                    print(f"No items found in group '{group}'.")
                    
            elif choice == 5:
                search_term = input("Enter search term: ")
                items = inventory_service.search_items(search_term)
                
                if items:
                    print("\nSearch results:")
                    for item in items:
                        print(item)
                else:
                    print("No items found matching the search term.")
                    
            elif choice == 6 and role == 'admin':
                filename = input("Enter filename to export data: ")
                format_type = input("Enter format type (csv or json): ").lower()
                
                items = inventory_service.get_inventory()
                generate_report(filename, items, format_type)
                print(f"Data exported to {filename}")
                
            elif choice == 7 and role == 'admin':
                filename = input("Enter filename to generate report: ")
                groups_input = input("Enter group(s) to include in report (comma separated) or leave blank for entire inventory: ")
                groups = [group.strip() for group in groups_input.split(',')] if groups_input else None
                format_type = input("Enter format type (csv or json): ").lower()
                
                report_service.generate_inventory_report(filename, groups, format_type)
                print(f"Report generated in {filename}")
                
            elif choice == 8:
                item_name = input("Enter item name: ")
                history = inventory_service.get_item_history(item_name)
                
                if history:
                    print(f"\nHistory for item '{item_name}':")
                    for entry in history:
                        print(entry)
                else:
                    print(f"No history found for item '{item_name}'.")
                    
            elif choice == 9 and role == 'admin':
                backup_file = inventory_service.backup_data()
                print(f"Backup created: {backup_file}")
                
            elif choice == 10 and role == 'admin':
                item_name = input("Enter item name to delete: ")
                if inventory_service.delete_item(item_name):
                    print(f"Item '{item_name}' deleted from inventory.")
                else:
                    print(f"Item '{item_name}' not found.")
                    
            elif choice == 11 and role == 'admin':
                old_group_name = input("Enter old group name: ")
                new_group_name = input("Enter new group name: ")
                
                if inventory_service.rename_group(old_group_name, new_group_name):
                    print(f"Group renamed from '{old_group_name}' to '{new_group_name}'.")
                else:
                    print(f"No items found in group '{old_group_name}'.")
                    
            elif choice == 12 and role == 'admin':
                user_menu(user_service)
                
            elif choice == 13:
                print("Thank you for using Inventory Management System. Goodbye!")
                break
                
            else:
                print("Invalid choice or insufficient permissions.")
                
        except Exception as e:
            logging.error(f"Error: {e}")
            print(f"Error: {e}")


def user_menu(user_service):
    """User management menu."""
    while True:
        print("\nUser Management")
        print("-----------------")
        print("1. Add user")
        print("2. Change user role")
        print("3. Delete user")
        print("4. List users")
        print("5. Back to main menu")
        
        try:
            choice = int(input("\nEnter your choice: "))
            
            if choice == 1:
                username = input("Enter new username: ")
                password = input("Enter new password: ")
                role = input("Enter role (admin, editor, viewer): ")
                
                if user_service.add_user(username, password, role):
                    print(f"User '{username}' added successfully.")
                else:
                    print(f"Failed to add user '{username}'.")
                    
            elif choice == 2:
                username = input("Enter username to change role: ")
                new_role = input("Enter new role (admin, editor, viewer): ")
                
                if user_service.change_role(username, new_role):
                    print(f"Role for user '{username}' changed to '{new_role}'.")
                else:
                    print(f"Failed to change role for user '{username}'.")
                    
            elif choice == 3:
                username = input("Enter username to delete: ")
                
                if username == 'user':  # Protect default admin user
                    print("Cannot delete default admin user.")
                else:
                    if user_service.delete_user(username):
                        print(f"User '{username}' deleted successfully.")
                    else:
                        print(f"Failed to delete user '{username}'.")
                        
            elif choice == 4:
                users = user_service.get_users()
                print("\nUsers:")
                for user in users:
                    print(f"Username: {user['username']}, Role: {user['role']}")
                    
            elif choice == 5:
                break
                
            else:
                print("Invalid choice.")
                
        except Exception as e:
            logging.error(f"Error: {e}")
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
