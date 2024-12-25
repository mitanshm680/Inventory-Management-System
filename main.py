from UserManager import UserManager
from Inventory import Inventory
import logging

# Initialize UserManager
user_manager = UserManager()

# Authenticate user
while True:
    username = input("Enter username: ")
    password = input("Enter password: ")
    role = user_manager.authenticate(username, password)
    if role:
        break

# Initialize Inventory
inventory = Inventory('inventory.db')

# Main program loop with permission checks
while True:
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
        choice = int(input("Enter your choice: "))

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
            inventory.add_item(item_name, quantity, group, custom_fields)
        elif choice == 2 and role in ('admin', 'editor'):
            item_name = input("Enter item name: ")
            quantity = int(input("Enter quantity: "))
            inventory.remove_item(item_name, quantity)
        elif choice == 3:
            groups = input("Enter group(s) to check (comma separated) or leave blank for entire inventory: ")
            groups = [group.strip() for group in groups.split(',')] if groups else None
            if groups is None or all(group in inventory.groups for group in groups):
                inventory.check_inventory(groups)
            else:
                print("One or more groups not found in inventory")
        elif choice == 4:
            group = input("Enter group: ")
            if group in inventory.groups:
                inventory.check_inventory([group])
            else:
                print("Group not found in inventory")
        elif choice == 5:
            search_term = input("Enter search term: ")
            inventory.search_item(search_term)
        elif choice == 6 and role == 'admin':
            filename = input("Enter filename to export data: ")
            inventory.export_data(filename)
        elif choice == 7 and role == 'admin':
            filename = input("Enter filename to generate report: ")
            groups = input("Enter group(s) to include in report (comma separated) or leave blank for entire inventory: ")
            groups = [group.strip() for group in groups.split(',')] if groups else None
            inventory.generate_report(filename, groups)
        elif choice == 8:
            item_name = input("Enter item name: ")
            inventory.view_item_history(item_name)
        elif choice == 9 and role == 'admin':
            inventory.backup_data()
        elif choice == 10 and role == 'admin':
            item_name = input("Enter item name: ")
            inventory.delete_item(item_name)
        elif choice == 11 and role == 'admin':
            old_group_name = input("Enter old group name: ")
            new_group_name = input("Enter new group name: ")
            inventory.rename_group(old_group_name, new_group_name)
        elif choice == 12 and role == 'admin':
            while True:
                print("1. Add user")
                print("2. Change user role")
                print("3. Delete user")
                print("4. List users")
                print("5. Back")
                user_choice = int(input("Enter your choice: "))
                if user_choice == 1:
                    new_username = input("Enter new username: ")
                    new_password = input("Enter new password: ")
                    new_role = input("Enter role (admin, editor, viewer): ")
                    user_manager.add_user(new_username, new_password, new_role)
                elif user_choice == 2:
                    change_username = input("Enter username to change role: ")
                    new_role = input("Enter new role (admin, editor, viewer): ")
                    user_manager.change_role(change_username, new_role)
                elif user_choice == 3:
                    delete_username = input("Enter username to delete: ")
                    if delete_username == 'mitansh':
                        print("User 'mitansh' cannot be deleted.")
                    else:
                        user_manager.delete_user(delete_username)
                elif user_choice == 4:
                    user_manager.list_users()
                elif user_choice == 5:
                    break
                else:
                    print("Invalid choice.")
        elif choice == 13:
            break
        else:
            print("Invalid choice or insufficient permissions.")
    except Exception as e:
        logging.error(f"Error: {e}")
        print(f"Error: {e}")
