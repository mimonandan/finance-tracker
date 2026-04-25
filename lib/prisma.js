// prisma.js - Prisma client setup and configuration.
// This file initializes the Prisma client and exports it for use in other parts of the application.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;