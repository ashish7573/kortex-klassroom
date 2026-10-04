const fs = require('fs');
let code = fs.readFileSync('kortex_users/kortex_admin/KortexAdminDashboard.tsx', 'utf8');

if (!code.includes("import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';")) {
    code = code.replace(
        "import React, { useState } from 'react';",
        "import React, { useState, useEffect } from 'react';\nimport { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';\nimport { db } from '../../backend_configurations/firebase';"
    );
}

if (!code.includes("const [inquiries, setInquiries]")) {
    code = code.replace(
        "const [activeSubTab, setActiveSubTab] = useState<'quotes' | 'system' | 'approvals' | 'users'>('quotes');",
        "const [activeSubTab, setActiveSubTab] = useState<'quotes' | 'system' | 'approvals' | 'users'>('quotes');\n  const [inquiries, setInquiries] = useState<any[]>([]);\n\n  useEffect(() => {\n    const q = query(collection(db, 'quote_inquiries'), orderBy('created_at', 'desc'));\n    const unsubscribe = onSnapshot(q, (snapshot) => {\n      setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));\n    });\n    return () => unsubscribe();\n  }, []);\n"
    );
}

const oldQuotesDiv = `<div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <UserCheck className="mx-auto text-slate-300 mb-3" size={40} />
            <h4 className="text-base font-bold text-slate-700">No pending quote inquiries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              New inquiries submitted through the "Partner With Us" institution form will automatically appear here for one-click account creation.
            </p>
          </div>`;

const newQuotesDiv = `{inquiries.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
            <UserCheck className="mx-auto text-slate-300 mb-3" size={40} />
            <h4 className="text-base font-bold text-slate-700">No pending quote inquiries</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              New inquiries submitted through the "Partner With Us" institution form will automatically appear here for one-click account creation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq: any) => (
              <div key={inq.id} className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 hover:border-indigo-100 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-black text-slate-800">{inq.organization_name}</h4>
                    <span className={\`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider \${inq.status === 'new' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}\`}>
                      {inq.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600 mb-4">
                    <p><strong className="text-slate-800">Contact:</strong> {inq.contact_person}</p>
                    <p><strong className="text-slate-800">Email:</strong> {inq.email}</p>
                    <p><strong className="text-slate-800">Phone:</strong> {inq.phone}</p>
                    <p><strong className="text-slate-800">Est. Students:</strong> {inq.estimated_students}</p>
                    <p><strong className="text-slate-800">Type:</strong> <span className="capitalize">{inq.org_type}</span></p>
                    <p><strong className="text-slate-800">Date:</strong> {new Date(inq.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 italic">
                    "{inq.message}"
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                   {inq.status === 'new' && (
                     <button 
                       onClick={() => updateDoc(doc(db, 'quote_inquiries', inq.id), { status: 'reviewed' })}
                       className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap"
                     >
                       Mark Reviewed
                     </button>
                   )}
                   <a 
                     href={\`mailto:\${inq.email}?subject=Kortex Klassroom Institutional Quote\`!}
                     className="w-full px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-colors text-center whitespace-nowrap"
                   >
                     Email Contact
                   </a>
                </div>
              </div>
            ))}
          </div>
        )}`;

code = code.replace(oldQuotesDiv, newQuotesDiv);
fs.writeFileSync('kortex_users/kortex_admin/KortexAdminDashboard.tsx', code);
