import re

with open('app/actions/student.ts', 'r') as f:
    content = f.read()

old_sig = """export async function updateParentProfile(
  idToken: string,
  updateData: {
    fullName: string;
    contactNumber: string;
    email: string;
  }
) {"""

new_sig = """export async function updateParentProfile(
  idToken: string,
  updateData: {
    fullName: string;
    contactNumber: string;
    email: string;
    city?: string;
    country?: string;
  }
) {"""

content = content.replace(old_sig, new_sig)

old_update = """    batch.update(parentRef, {
      full_name: updateData.fullName,
      contact_number: updateData.contactNumber,
      email: updateData.email,
      updated_at: new Date().toISOString()
    });"""

new_update = """    const parentUpdateObj: any = {
      full_name: updateData.fullName,
      contact_number: updateData.contactNumber,
      email: updateData.email,
      updated_at: new Date().toISOString()
    };
    if (updateData.city !== undefined) parentUpdateObj.city = updateData.city;
    if (updateData.country !== undefined) parentUpdateObj.country = updateData.country;

    batch.update(parentRef, parentUpdateObj);"""

content = content.replace(old_update, new_update)

with open('app/actions/student.ts', 'w') as f:
    f.write(content)

