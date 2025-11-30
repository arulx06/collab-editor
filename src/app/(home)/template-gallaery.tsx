"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import  {templates} from "../../constants/templates"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useState } from "react"
import { toast } from "sonner"

const TemplateGallary = ()=>{

    const router = useRouter()
    const create = useMutation(api.documents.create)

    const [isCreating,setIsCreating]  = useState(false)


    const onTemplateClick = async (title: string, initialContent: string) => {
        setIsCreating(true)

        try {
            const documentId = await create({ title, initialContent })

            if (!documentId) {
            throw new Error("Document not created")
            }
            toast.success("Document created")
            router.push(`/documents/${documentId}`)

        } catch (e) {
            toast.error("Something went wrong")
            console.log(e);

        } finally {
            setIsCreating(false)
        }
    }


    return(
        <div className="origin-top-left">
           <div className="bg-[#F1F3F4]">
            <div className="max-w-screen-xlz mx-auto px-16 py-2 flex flex-col gap-y-4">
                <h3 className="font-medium">Create a new Document</h3>
                <Carousel>
                    <CarouselContent className="-ml-4">
                        {templates.map((template)=>(
                            <CarouselItem
                                key = {template.id}
                                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-[14.285714%] pl-4"
                            >
                                <div className={cn(
                                    "aspect-[3/4] flex flex-col gap-y-2.5",
                                    isCreating && "pointer-events-none opacity-50"
                                )}>
                                    <button 
                                        disabled={isCreating}
                                        onClick={()=> onTemplateClick(template.label,template.initialContent ?? "")}
                                        style={{
                                            backgroundImage: `url(${template.imageUrl})`,
                                            backgroundSize:"cover",
                                            backgroundPosition:"center",
                                            backgroundRepeat:"no-repeat",
                                        }}
                                        className="size-full hover:border-blue-500 rounded-sm hover:bg-blue-50 transition flex flex-col items-center justify-center gap-y-4 bg-white"
                                    >
                                    </button>
                                    <p className="text-sm font-medium truncate">
                                        {template.label}
                                    </p>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious/>
                    <CarouselNext />
                </Carousel>
            </div>

           </div>
        </div>
    )
}

export default TemplateGallary;