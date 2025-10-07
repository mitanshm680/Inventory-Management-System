"""
Populate Database with Sample Data
Simple script to quickly populate the database with test data
"""
import subprocess
import sys
import os

def main():
    """Run the sample data generation script"""
    print("=" * 60)
    print("POPULATE DATABASE WITH SAMPLE DATA")
    print("=" * 60)
    print()

    # Check if database exists
    if not os.path.exists('inventory.db'):
        print("[ERROR] Database file not found!")
        print("Please run 'python run.py' first to create the database.")
        sys.exit(1)

    print("[INFO] Database found. Generating sample data...")
    print()

    try:
        # Run the generate_sample_data.py script
        result = subprocess.run(
            [sys.executable, 'generate_sample_data.py'],
            check=True,
            capture_output=True,
            text=True
        )

        # Print the output from the generation script
        print(result.stdout)

        if result.stderr:
            print("[WARNINGS]")
            print(result.stderr)

        print()
        print("=" * 60)
        print("[SUCCESS] Database populated with sample data!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("  1. Start the API server:")
        print("     python run.py")
        print()
        print("  2. Start the frontend:")
        print("     cd frontend && npm start")
        print()
        print("  3. Login with:")
        print("     Username: admin")
        print("     Password: 1234")
        print()

    except subprocess.CalledProcessError as e:
        print()
        print("=" * 60)
        print("[ERROR] Failed to populate database!")
        print("=" * 60)
        print()
        print(e.stdout)
        if e.stderr:
            print(e.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print()
        print("[ERROR] Python interpreter not found!")
        print("Please ensure Python is installed and in your PATH.")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
