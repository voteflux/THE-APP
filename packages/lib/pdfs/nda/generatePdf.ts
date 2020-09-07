import { UserV1Object } from './../../types/db';

import {yourSignaturePlaceholder} from './imageUris'

import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from "pdfmake/build/vfs_fonts"
import DocumentInfo = PDFKit.DocumentInfo;
import {TDocumentDefinitions} from "pdfmake/interfaces";
pdfMake.vfs = pdfFonts.pdfMake.vfs

type PdfText = {
    text: string | PdfText | Array<string | PdfText>,
    bold?: boolean,
}


export const genNdaDetailsFromUser = (user: UserV1Object) => {
    return {
        fullName: [user.fname, user.mnames, user.sname].join(' '),
        fullAddr: [user.addr_street_no + ' ' + user.addr_street, user.addr_suburb, user.addr_postcode, user.addr_country].join(', ')
    }
}


export const genPdf = async (
    fullName="<FULL NAME>",
    fullAddr="<FULL ADDR>",
    signatureDataURI=yourSignaturePlaceholder
): Promise<{uri: string}> => {
    const date = new Date()

    // GENERATE NDA

    const getMargin = (xLevel: number, topPadding=10) => ([xLevel * 20, topPadding, 0, 0])
    const track = {s0: 0, s1: 0, s2: 0}
    const s0 = (txt: string | PdfText, opts={}) => {
        track.s0 += 1
        track.s1 = 0
        track.s2 = 0
        return { margin: getMargin(0, 20), bold: true, ...opts, text: [ `${track.s0}.\t`, txt, `\n`] }
    }
    const s1 = (txt: string | PdfText, opts={}) => {
        track.s1 += 1
        track.s2 = 0
        return { margin: getMargin(1), ...opts, text: [ `${track.s0}.${track.s1}\t`, txt, `\n`] }
    }
    const s2 = (txt: string | PdfText, opts={}) => {
        track.s2 += 1
        return { margin: getMargin(2), ...opts, text: [ `${track.s0}.${track.s1}.${track.s2}\t`, txt, `\n`] }
    }

    const doBreak = { preferBreak: true }

    const docDefinition = {
        content: [
            {
                style: 'tableNoBorders',
                table: {
                    headerRows: 0,
                    body: [
                        ['Date:', { text: `${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}`}],
                        ['', ''],
                        ['TO:', { text: [ {text: 'THE FLUX FOUNDATION LIMITED', bold: true}, ' (', {text: "the Company", bold: true}, ')'] }],
                        [' ',  { text: [ "(ACN: ", {text: '617 344 304', bold: true}, ')'] }],
                        ['', ''],
                        ['FROM:', {text: [{text: fullName, bold: true}, ' (', {text: 'the Recipient', bold: true}, ')']}],
                        [' ', {text: ['of ', {text: fullAddr, bold: true}]}],
                        [' ', ' '],
                    ]
                },
                layout: 'noBorders'
            },
            { text: "BACKGROUND", bold: true },
            "\nThe Company wants to provide to the Recipient information which it treats as being confidential and would not, but for this Undertaking, provide.",
            "\nThe Company wants to protect the confidentiality of its information and to prevent the Recipient using the information for purposes other than for which it is provided.",
            "\nThe information the Company is providing is for the purpose of: interactions and contact with Flux members, validating Flux members’ electoral roll details, the establishment and/or membership audit of one or more Australian Flux branches (either state or federal), and other party business solely related to ethical use of Flux member details to further the objects of the Flux Foundation, as set out in its constitution.",
            "\nThe terms of this agreement require the recipient to keep all private information obtained through the validation process private and confidential. The only parties with whom the Recipient may discuss this information described above are employees of the Flux Foundation or other Recipients of this document (a fact that must be verified via the Flux Foundation; a claim by a party that they have signed this document is not sufficient).\n",
            { ul: [
                s0("INTERPRETATIONS"),
                s1("In this Undertaking, unless the context otherwise requires:"),
                s2("headings are for convenience only and do not affect its interpretation;"),
                s2("the expression ‘person’ includes an individual, the estate of an individual, a corporation, an authority, an association or joint venture (whether incorporated or unincorporated), a partnership and a trust;"),
                s2("a reference to any Party includes that Party’s executors, administrators, successors and permitted assigns, including any person taking by way of novation;"),
                s2("words importing the singular include the plural (and vice versa) and words indicating a gender include every other gender; and"),
                s2("where a word or phrase is given a defined meaning, any other part of speech or grammatical form of that word or phrase has a corresponding meaning."),
                s0("INTRODUCTION"),
                s1({text: [ "The term ", {text: "Confidential Information", bold: true}, " means information relating directly or indirectly to or about the Company that is marked or notified orally as being confidential or which the Recipient ought to know is confidential." ]}),
                s1("This Undertaking applies to Confidential Information irrespective of the format or means by which the Confidential Information is disclosed."),
                s1("The confidentiality undertakings given by the Recipient in this Undertaking do not apply to the extent that Confidential Information:"),
                s2("is in the public domain through no fault of the Recipient;"),
                s2("was known to the Recipient, without restriction, prior to disclosure by the Company;"),
                s2("was disclosed to the Recipient, without restriction, by another person with the legal authority to do so;"),
                s2("is required to be disclosed pursuant to a judicial or legislative order or proceeding, provided the Recipient will not disclose any Confidential Information without first using its best efforts to inform the Company of such legal requirement, giving the Company a reasonable opportunity to contest such requirement and to the maximum extent possible, minimise the disclosure of the Confidential Information."),
                s1("Damages may be inadequate compensation for breach of an obligation under this Undertaking and, subject to the court’s discretion, the Company may restrain by an injunction or similar remedy, any conduct or threatened conduct which is or would be a breach of an obligation under this Undertaking."),
                s0("CONFIDENTIALITY UNDERTAKINGS"),
                s1("The Recipient undertakes to the Company:"),
                s2("to keep confidential any and all Confidential Information;"),
                s2("to not disclose the Confidential Information to any other person;"),
                s2("to use the Confidential Information solely in respect of the Purpose and for no other Purpose;"),
                s2("to not use the Confidential Information to copy, recreate, emulate or otherwise create its own version of anything disclosed by the Confidential Information; and"),
                s2("not make copies of the Confidential Information or any part of the Confidential Information other than for the Purpose."),
                s1("On the Company’s request, the Recipient must promptly cease use of and return to the Company all of the Confidential Information provided to the Recipient."),
                s0("GENERAL"),
                s1("No failure or delay by any Party in exercising or enforcing any right, power or remedy which arises under this Undertaking will operate as a waiver of that or any other right, power or remedy."),
                s1("This Undertaking is governed by the laws of the New South Wales. Each party irrevocably and unconditionally submits to the exclusive jurisdiction of the courts of New South Wales.", doBreak),
                {text: "\n\nExecuted as a Deed Poll", bold: true},
                {text: ["\n\nSigned by ", {text: `${fullName} (the Recipient):`, bold: true}] },
                {image: signatureDataURI, width: 250},
                { text: `Date:\t ${date.getDate()} / ${date.getMonth() + 1} / ${date.getFullYear()}`}
            ], type: 'none' }
        ],

        styles: {
            header: {
                bold: true,
                alignment: 'center'
            },
            center: {
                alignment: 'center'
            },
            tableNoBorders: {}
        },

        images: {},

        header: { text: [{ text: 'CONFIDENTIALITY UNDERTAKING\n', style: 'header'}], margin: [0, 30, 0, 0] },
        footer: function(currentPage: number, pageCount: number) { return { text: currentPage.toString() + ' of ' + pageCount, alignment: 'center', margin: [0, 10, 0, 0]}; },
        canvas: '',
        pageMargins: [ 40, 60, 40, 60 ] as [number,number,number,number],

        // this doesn't work...
        pageBreakBefore: (currentNode: any, followingNodesOnPage: any, nodesOnNextPage: any, previousNodesOnPage: any) => {
            // @ts-ignore
            if ( currentNode.preferBreak && followingNodesOnPage.every(n => n.preferBreak !== true) ) {
                return true
            }
            return false
        }
    } as TDocumentDefinitions

    // DONE GENERATING NDA

    return {
        uri: await (new Promise((res, rej) => (pdfMake.createPdf(docDefinition) as any).getDataUrl(res))) as string
    }
}
