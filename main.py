#necessary imports
import json
import logging
import csv
import shutil
from datetime import datetime
import hashlib

# Configure logging
logging.basicConfig(filename='inventory.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

class UserManager:
    def __init__(self, userfile='users.json'):
        self.userfile = userfile
        try:
            with open(self.userfile, 'r') as f:
                self.users = json.load(f)
        except FileNotFoundError:
            self.users = {
                'user': {
                    'password': hashlib.sha256('1234'.encode()).hexdigest(),
                    'role': 'admin'
                }
            }
            self.save_users()

    def save_users(self):
        with open(self.userfile, 'w') as f:
            json.dump(self.users, f, indent=4)

    def add_user(self, username, password, role='viewer'):
        if username in self.users:
            print("User already exists.")
            return False
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        self.users[username] = {'password': hashed_pw, 'role': role}
        self.save_users()
        print("User added successfully.")
        return True

    def authenticate(self, username, password):
        if username in self.users:
            hashed_pw = hashlib.sha256(password.encode()).hexdigest()
            if self.users[username]['password'] == hashed_pw:
                print("Authentication successful.")
                return self.users[username]['role']
        print("Authentication failed.")
        return None

    def change_password(self, username, new_password):
        if username in self.users:
            hashed_pw = hashlib.sha256(new_password.encode()).hexdigest()
            self.users[username]['password'] = hashed_pw
            self.save_users()
            print("Password changed successfully.")
            return True
        print("User not found.")
        return False

    def delete_user(self, username):
        if username in self.users:
            del self.users[username]
            self.save_users()
            print("User deleted successfully.")
            return True
        print("User not found.")
        return False

    def list_users(self):
        for username, details in self.users.items():
            print(f"Username: {username}, Role: {details['role']}")

    def change_role(self, username, new_role):
        if username in self.users:
            self.users[username]['role'] = new_role
            self.save_users()
            print("Role changed successfully.")
            return True
        print("User not found.")
        return False

class Inventory:
    def __init__(self, filename):
        self.filename = filename
        try:
            with open(self.filename, 'r') as f:
                data = json.load(f)
                self.items = data.get('items', {})
                self.groups = data.get('groups', {})
                self.history = data.get('history', {})
        except FileNotFoundError:
            self.items = {}
            self.groups = {}
            self.history = {}
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON from file {self.filename}: {e}")
            self.items = {}
            self.groups = {}
            self.history = {}

    def save(self):
        try:
            with open(self.filename, 'w') as f:
                json.dump({'items': self.items, 'groups': self.groups, 'history': self.history}, f, indent=4)
        except Exception as e:
            logging.error(f"Error saving data: {e}")

    def log_action(self, action, item_name, quantity=None, group=None):
        log_entry = f"{action} - Item: {item_name}"
        if quantity:
            log_entry += f", Quantity: {quantity}"
        if group:
            log_entry += f", Group: {group}"
        logging.info(log_entry)
        self.history.setdefault(item_name, []).append({'action': action, 'quantity': quantity, 'group': group, 'timestamp': datetime.now().isoformat()})

    def add_item(self, item_name, quantity, group=None, custom_fields=None):
        try:
            if item_name in self.items:
                self.items[item_name]['quantity'] += quantity
            else:
                self.items[item_name] = {'quantity': quantity, 'group': group, 'custom_fields': custom_fields or {}}

            if group:
                if group in self.groups:
                    self.groups[group].append(item_name)
                else:
                    self.groups[group] = [item_name]

            self.log_action('ADD', item_name, quantity, group)
            self.save()
            self.check_low_stock(item_name)
        except Exception as e:
            logging.error(f"Error adding item: {e}")

    def remove_item(self, item_name, quantity):
        try:
            if item_name in self.items:
                if self.items[item_name]['quantity'] >= quantity:
                    self.items[item_name]['quantity'] -= quantity
                    if self.items[item_name]['quantity'] == 0:
                        group = self.items[item_name]['group']
                        del self.items[item_name]
                        if group and item_name in self.groups.get(group, []):
                            self.groups[group].remove(item_name)
                            if not self.groups[group]:
                                del self.groups[group]
                else:
                    print("Not enough quantity in inventory")
            else:
                print("Item not found in inventory")

            self.log_action('REMOVE', item_name, quantity)
            self.save()
            self.check_low_stock(item_name)
        except Exception as e:
            logging.error(f"Error removing item: {e}")

    def check_low_stock(self, item_name):
        if item_name in self.items and self.items[item_name]['quantity'] < 10:  # Set your own threshold
            print(f"Warning: Low stock for item '{item_name}'. Current quantity: {self.items[item_name]['quantity']}")

    def check_inventory(self, groups=None):
        try:
            items_to_check = self.items if groups is None else {item: details for group in groups for item, details in self.items.items() if details['group'] == group}
            for item_name, details in items_to_check.items():
                custom_fields = details.get('custom_fields', {})
                custom_fields_str = ', '.join([f"{k}: {v}" for k, v in custom_fields.items()])
                print(f"{item_name} (Group: {details['group']}): {details['quantity']}, {custom_fields_str}")
        except Exception as e:
            logging.error(f"Error checking inventory: {e}")

    def view_item_history(self, item_name):
        try:
            if item_name in self.history:
                for entry in self.history[item_name]:
                    print(f"{entry['timestamp']}: {entry['action']} - Quantity: {entry['quantity']}, Group: {entry['group']}")
            else:
                print("No history found for this item.")
        except Exception as e:
            logging.error(f"Error viewing item history: {e}")

    def search_item(self, search_term):
        try:
            start_matches = {item_name: details for item_name, details in self.items.items() if item_name.startswith(search_term)}

            if start_matches:
                print("Items starting with '{}':".format(search_term))
                for item_name, details in start_matches.items():
                    custom_fields = details.get('custom_fields', {})
                    custom_fields_str = ', '.join([f"{k}: {v}" for k, v in custom_fields.items()])
                    print(f"{item_name} (Group: {details['group']}): {details['quantity']}, {custom_fields_str}")
            else:
                contain_matches = {item_name: details for item_name, details in self.items.items() if search_term in item_name}

                if contain_matches:
                    print("Items containing '{}':".format(search_term))
                    for item_name, details in contain_matches.items():
                        custom_fields = details.get('custom_fields', {})
                        custom_fields_str = ', '.join([f"{k}: {v}" for k, v in custom_fields.items()])
                        print(f"{item_name} (Group: {details['group']}): {details['quantity']}, {custom_fields_str}")
                else:
                    print("No items found with search term '{}'".format(search_term))
        except Exception as e:
            logging.error(f"Error searching item: {e}")

    def export_data(self, filename):
        try:
            with open(filename, 'w') as f:
                json.dump({'items': self.items, 'groups': self.groups}, f, indent=4)
            print(f"Data exported to {filename}")
        except Exception as e:
            logging.error(f"Error exporting data: {e}")

    def generate_report(self, filename, groups=None):
        try:
            with open(filename, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['Item Name', 'Quantity', 'Group', 'Custom Fields'])
                
                total_items = 0
                total_quantity = 0
                items_to_report = self.items if groups is None else {item: details for group in groups for item, details in self.items.items() if details['group'] == group}

                for item_name, details in items_to_report.items():
                    custom_fields = details.get('custom_fields', {})
                    custom_fields_str = ', '.join([f"{k}: {v}" for k, v in custom_fields.items()])
                    writer.writerow([item_name, details['quantity'], details['group'], custom_fields_str])
                    total_items += 1
                    total_quantity += details['quantity']
                
                # Adding summary
                writer.writerow([])
                writer.writerow(['Summary'])
                writer.writerow(['Total Items', total_items])
                writer.writerow(['Total Quantity', total_quantity])
            print(f"Report generated in {filename}")
        except Exception as e:
            logging.error(f"Error generating report: {e}")

    def backup_data(self):
        try:
            backup_filename = f"backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
            shutil.copy(self.filename, backup_filename)
            print(f"Backup created: {backup_filename}")
        except Exception as e:
            logging.error(f"Error creating backup: {e}")

    def delete_item(self, item_name):
        try:
            if item_name in self.items:
                group = self.items[item_name]['group']
                del self.items[item_name]
                if group and item_name in self.groups.get(group, []):
                    self.groups[group].remove(item_name)
                    if not self.groups[group]:
                        del self.groups[group]
                self.log_action('DELETE', item_name)
                self.save()
            else:
                print("Item not found in inventory")
        except Exception as e:
            logging.error(f"Error deleting item: {e}")

    def rename_group(self, old_group_name, new_group_name):
        try:
            if old_group_name in self.groups:
                self.groups[new_group_name] = self.groups.pop(old_group_name)
                for item_name in self.groups[new_group_name]:
                    self.items[item_name]['group'] = new_group_name
                self.save()
                print(f"Group renamed from {old_group_name} to {new_group_name}")
            else:
                print("Group not found")
        except Exception as e:
            logging.error(f"Error renaming group: {e}")

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
inventory = Inventory('inventory.json')

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
