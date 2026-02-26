import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

let _adminApp: App | null = null

function getAdminApp(): App {
    if (!_adminApp) {
        if (getApps().length === 0) {
            // Try to use service account key from env variable
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            if (serviceAccountJson) {
                const serviceAccount = JSON.parse(serviceAccountJson)
                _adminApp = initializeApp({
                    credential: cert(serviceAccount),
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                })
            } else {
                // Fallback: initialize with project ID only (for environments with ADC)
                _adminApp = initializeApp({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
                })
            }
        } else {
            _adminApp = getApps()[0]
        }
    }
    return _adminApp
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp())
}
