#!/usr/bin/env python3

import sys
import os
sys.path.append('.')

try:
    from app.routes import spots
    print("Import successful")
    print("Number of routes:", len(spots.router.routes))
    print("Routes in spots router:")
    for route in spots.router.routes:
        print(f"  {route.path}: {route.methods}")

    # Test if we can import the POST handler
    create_spot = getattr(spots, 'create_spot', None)
    print(f"\ncreate_spot function exists: {create_spot is not None}")
    if create_spot:
        print(f"create_spot function: {create_spot}")
except Exception as e:
    print(f"Import error: {e}")
    import traceback
    traceback.print_exc()